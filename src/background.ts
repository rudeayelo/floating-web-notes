import type {
  ContentStartupState,
  Note,
  NotesExport,
  NotesImportMode,
  NotesImportResponse,
  OpenOptions,
  RuntimeMessageErrorPayload,
  RuntimeMessageResponse,
  UrlState,
  Visibility,
} from "./types";
import { urlMatchesPattern } from "./utils/urls";

const isMissingMessageReceiverError = (error: unknown) =>
  error instanceof Error &&
  error.message.includes("Receiving end does not exist");

const checkHotkeyConflict = async () => {
  const commands = await chrome.commands.getAll();
  return commands.some(({ shortcut }) => shortcut === "");
};

const notesExportApp = "floating-web-notes" as const;
const notesExportSchemaVersion = 1;
const storageMutationLockName = "floating-web-notes:storage-mutation";

const withStorageMutationLock = <T>(operation: () => Promise<T>): Promise<T> =>
  navigator.locks.request(storageMutationLockName, operation);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isValidNote = (value: unknown): value is Note => {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.pattern === "string" &&
    value.pattern.trim().length > 0 &&
    typeof value.text === "string"
  );
};

const isValidPosition = (value: unknown): value is { x: number; y: number } => {
  if (!isRecord(value)) return false;

  return Number.isFinite(value.x) && Number.isFinite(value.y);
};

const sanitizeUrlState = (value: unknown): UrlState => {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([url, state]) => {
      if (!url || !isRecord(state) || !isValidPosition(state.position)) {
        return [];
      }

      return [
        [
          url,
          {
            position: {
              x: state.position.x,
              y: state.position.y,
            },
          },
        ],
      ];
    }),
  );
};

const getStoredNoteIds = async () => {
  const { notesById } = await chrome.storage.local.get("notesById");
  return Array.isArray(notesById)
    ? notesById.filter((id): id is string => typeof id === "string")
    : [];
};

const getStoredNotes = async () => {
  const ids = await getStoredNoteIds();
  if (!ids.length) return [];

  const notesByStorageKey = await chrome.storage.local.get(ids);
  return ids
    .map((id) => notesByStorageKey[id])
    .filter((note): note is Note => isValidNote(note));
};

const getStoredUrlState = async () => {
  const { urlState } = await chrome.storage.local.get("urlState");
  return sanitizeUrlState(urlState);
};

const createNotesExport = async (): Promise<NotesExport> => ({
  app: notesExportApp,
  schemaVersion: notesExportSchemaVersion,
  exportedAt: new Date().toISOString(),
  notes: await getStoredNotes(),
  urlState: await getStoredUrlState(),
});

const sameNoteContent = (a: Note, b: Note) =>
  a.pattern === b.pattern && a.text === b.text;

const createUniqueNoteId = (id: string, usedIds: Set<string>) => {
  let candidate = id;
  let suffix = 1;

  while (usedIds.has(candidate)) {
    candidate = `${id}-imported-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
};

const importNotes = async (
  exportData: unknown,
  mode: NotesImportMode,
): Promise<NotesImportResponse> =>
  withStorageMutationLock(async () => {
    if (!isRecord(exportData)) {
      return { ok: false, error: "Import file must be a JSON object." };
    }

    if (
      exportData.app !== notesExportApp ||
      exportData.schemaVersion !== notesExportSchemaVersion ||
      !Array.isArray(exportData.notes)
    ) {
      return {
        ok: false,
        error: "This does not look like a Floating Web Notes export.",
      };
    }

    const existingNotes = await getStoredNotes();
    const existingUrlState = await getStoredUrlState();
    const importedUrlState = sanitizeUrlState(exportData.urlState);
    const existingNotesById = new Map(
      existingNotes.map((note) => [note.id, note]),
    );
    const existingIds = new Set(existingNotes.map((note) => note.id));
    const usedIds = mode === "merge" ? new Set(existingIds) : new Set<string>();
    const importedNotes: Note[] = [];
    let skipped = 0;

    for (const candidate of exportData.notes) {
      if (!isValidNote(candidate)) {
        skipped += 1;
        continue;
      }

      const existingNote = existingNotesById.get(candidate.id);
      if (
        mode === "merge" &&
        existingNote &&
        sameNoteContent(existingNote, candidate)
      ) {
        skipped += 1;
        continue;
      }

      const id = createUniqueNoteId(candidate.id, usedIds);
      importedNotes.push({
        id,
        pattern: candidate.pattern,
        text: candidate.text,
      });
    }

    const nextNotes =
      mode === "merge" ? [...existingNotes, ...importedNotes] : importedNotes;
    const nextUrlState =
      mode === "merge"
        ? { ...existingUrlState, ...importedUrlState }
        : importedUrlState;
    const nextNoteIds = nextNotes.map((note) => note.id);
    const storageUpdate: Record<string, unknown> = {
      notesById: nextNoteIds,
      urlState: nextUrlState,
    };

    for (const note of importedNotes) {
      storageUpdate[note.id] = note;
    }

    await chrome.storage.local.set(storageUpdate);

    if (mode === "replace" && existingIds.size) {
      const retainedIds = new Set(nextNoteIds);
      const obsoleteIds = [...existingIds].filter((id) => !retainedIds.has(id));
      if (obsoleteIds.length) {
        try {
          await chrome.storage.local.remove(obsoleteIds);
        } catch (error) {
          console.warn(
            "Could not remove obsolete imported note records",
            error,
          );
        }
      }
    }

    return {
      ok: true,
      result: {
        imported: importedNotes.length,
        skipped,
        positionsImported: Object.keys(importedUrlState).length,
        mode,
      },
    };
  });

class RuntimeRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RuntimeRequestError";
    this.code = code;
  }
}

type RuntimeMessage = Record<string, unknown> & { type: string };

const parseRuntimeMessage = (message: unknown): RuntimeMessage => {
  if (!isRecord(message) || typeof message.type !== "string") {
    throw new RuntimeRequestError(
      "INVALID_MESSAGE",
      "Runtime messages must include a string type.",
    );
  }

  return message as RuntimeMessage;
};

const requireString = (value: unknown, field: string) => {
  if (typeof value !== "string") {
    throw new RuntimeRequestError(
      "INVALID_MESSAGE",
      `${field} must be a string.`,
    );
  }

  return value;
};

const requireTabId = (sender: chrome.runtime.MessageSender) => {
  if (typeof sender.tab?.id !== "number") {
    throw new RuntimeRequestError(
      "MISSING_TAB_ID",
      "This request must come from a browser tab.",
    );
  }

  return sender.tab.id;
};

const requirePosition = (value: unknown) => {
  if (!isValidPosition(value)) {
    throw new RuntimeRequestError(
      "INVALID_MESSAGE",
      "position must contain finite x and y coordinates.",
    );
  }

  return value;
};

const requireVisibility = (value: unknown) => {
  if (value !== "visible" && value !== "hidden") {
    throw new RuntimeRequestError(
      "INVALID_MESSAGE",
      "visibility must be either visible or hidden.",
    );
  }

  return value;
};

const resolveOpenDefault = (value: unknown): OpenOptions => {
  if (value === "always" || value === "never" || value === "with-notes") {
    return value;
  }

  return "with-notes";
};

const getContentStartupState = async (
  url: string,
  sender: chrome.runtime.MessageSender,
): Promise<ContentStartupState> => {
  const tabId = requireTabId(sender);
  const [localSettings, sessionState, notes] = await Promise.all([
    chrome.storage.local.get(["open", "firstTimeNoticeAck"]),
    chrome.storage.session.get("visibility") as Promise<{
      visibility?: Visibility;
    }>,
    getStoredNotes(),
  ]);

  const open = resolveOpenDefault(localSettings.open);
  const initialVisibility = sessionState.visibility?.[tabId];
  const hasCurrentNotes = notes.some((note) =>
    urlMatchesPattern({ url, pattern: note.pattern }),
  );

  if (!localSettings.firstTimeNoticeAck) {
    return { active: true };
  }

  const active = !(
    (open === "never" && initialVisibility !== "visible") ||
    (open === "with-notes" && !hasCurrentNotes) ||
    initialVisibility === "hidden"
  );

  return { active };
};

const toRuntimeError = (error: unknown): RuntimeMessageErrorPayload => {
  if (error instanceof RuntimeRequestError) {
    return { code: error.code, message: error.message };
  }

  return {
    code: "INTERNAL_ERROR",
    message:
      error instanceof Error
        ? error.message
        : "The extension background failed unexpectedly.",
  };
};

const handleRuntimeMessage = async (
  message: RuntimeMessage,
  sender: chrome.runtime.MessageSender,
): Promise<unknown> => {
  switch (message.type) {
    case "getContentStartupState":
      return getContentStartupState(requireString(message.url, "url"), sender);
    case "checkHotkeyConflict":
      return checkHotkeyConflict();
    case "getHotkeys":
      return chrome.commands.getAll();
    case "openExtensionPage":
      await chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
      return true;
    case "reloadExtension":
      return true;
    case "getVisibility": {
      const tabId = requireTabId(sender);
      const { visibility }: { visibility?: Visibility } =
        await chrome.storage.session.get("visibility");
      return visibility?.[tabId];
    }
    case "setVisibility": {
      const tabId = requireTabId(sender);
      const value = requireVisibility(message.value);
      await withStorageMutationLock(async () => {
        const { visibility }: { visibility?: Visibility } =
          await chrome.storage.session.get("visibility");
        await chrome.storage.session.set({
          visibility: { ...visibility, [tabId]: value },
        });
      });
      return true;
    }
    case "getOpenDefault": {
      const { open } = await chrome.storage.local.get("open");
      return open;
    }
    case "setOpenDefault":
      await chrome.storage.local.set({ open: message.value });
      return true;
    case "getTheme": {
      const { theme } = await chrome.storage.local.get("theme");
      return theme;
    }
    case "setTheme":
      await chrome.storage.local.set({ theme: message.theme });
      return true;
    case "getFirstTimeNoticeAck": {
      const { firstTimeNoticeAck }: { firstTimeNoticeAck?: boolean } =
        await chrome.storage.local.get("firstTimeNoticeAck");
      return firstTimeNoticeAck || false;
    }
    case "getDragHandleDiscovered": {
      const { dragHandleDiscovered } = await chrome.storage.local.get(
        "dragHandleDiscovered",
      );
      return Boolean(dragHandleDiscovered);
    }
    case "setDragHandleDiscovered":
      await chrome.storage.local.set({
        dragHandleDiscovered: Boolean(message.value),
      });
      return true;
    case "setFirstTimeNoticeAck":
      await chrome.storage.local.set({
        firstTimeNoticeAck: Boolean(message.value),
      });
      return true;
    case "getNotesById":
      return getStoredNoteIds();
    case "getAllNotes": {
      const ids = await getStoredNoteIds();
      const notes = await chrome.storage.local.get(ids);
      return Object.values(notes);
    }
    case "exportNotes":
      return withStorageMutationLock(createNotesExport);
    case "importNotes": {
      const mode = message.mode === "replace" ? "replace" : "merge";
      return importNotes(message.exportData, mode);
    }
    case "getNote": {
      const id = requireString(message.id, "id");
      const result = await chrome.storage.local.get(id);
      return result[id];
    }
    case "setNote": {
      const id = requireString(message.id, "id");
      const pattern = requireString(message.pattern, "pattern");
      const text = requireString(message.text, "text");
      await withStorageMutationLock(async () => {
        const ids = await getStoredNoteIds();
        await chrome.storage.local.set({
          [id]: { id, pattern, text },
          notesById: ids.includes(id) ? ids : [...ids, id],
        });
      });
      return true;
    }
    case "removeNote": {
      const id = requireString(message.id, "id");
      await withStorageMutationLock(async () => {
        const ids = await getStoredNoteIds();
        await chrome.storage.local.set({
          notesById: ids.filter((storedId) => storedId !== id),
        });
        try {
          await chrome.storage.local.remove(id);
        } catch (error) {
          console.warn("Could not remove an unindexed note record", error);
        }
      });
      return true;
    }
    case "getPosition": {
      const url = requireString(message.url, "url");
      const { urlState }: { urlState?: UrlState } =
        await chrome.storage.local.get("urlState");
      return urlState?.[url]?.position;
    }
    case "setPosition": {
      const url = requireString(message.url, "url");
      const position = requirePosition(message.position);
      await withStorageMutationLock(async () => {
        const { urlState }: { urlState?: UrlState } =
          await chrome.storage.local.get("urlState");
        await chrome.storage.local.set({
          urlState: { ...urlState, [url]: { position } },
        });
      });
      return true;
    }
    case "removePosition": {
      const url = requireString(message.url, "url");
      await withStorageMutationLock(async () => {
        const { urlState }: { urlState?: UrlState } =
          await chrome.storage.local.get("urlState");
        const nextUrlState = { ...urlState };
        delete nextUrlState[url];
        await chrome.storage.local.set({ urlState: nextUrlState });
      });
      return true;
    }
    case "getPreviousVersion": {
      const { previousVersion } =
        await chrome.storage.local.get("previousVersion");
      return previousVersion || null;
    }
    case "setPreviousVersion":
      await chrome.storage.local.set({
        previousVersion: String(message.value ?? ""),
      });
      return true;
    default:
      throw new RuntimeRequestError(
        "UNKNOWN_MESSAGE",
        `Unknown runtime message type: ${message.type}`,
      );
  }
};

const respondToRuntimeMessage = async (
  rawMessage: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: RuntimeMessageResponse<unknown>) => void,
) => {
  try {
    const message = parseRuntimeMessage(rawMessage);
    const data = await handleRuntimeMessage(message, sender);
    sendResponse({ ok: true, data });

    if (message.type === "reloadExtension") {
      chrome.runtime.reload();
    }
  } catch (error) {
    const runtimeError = toRuntimeError(error);
    if (runtimeError.code === "INTERNAL_ERROR") {
      console.error("Runtime message failed", error);
    }
    sendResponse({ ok: false, error: runtimeError });
  }
};

const handleInstalled = async (details: chrome.runtime.InstalledDetails) => {
  try {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
      await checkHotkeyConflict();
    }

    if (
      details.reason === chrome.runtime.OnInstalledReason.UPDATE &&
      details.previousVersion
    ) {
      await chrome.storage.local.set({
        previousVersion: details.previousVersion,
      });
    }
  } catch (error) {
    console.error("Extension installation handler failed", error);
  }
};

const handleActionClick = async (activeTab: chrome.tabs.Tab) => {
  const tabId = activeTab.id;
  if (typeof tabId !== "number") return;

  try {
    await withStorageMutationLock(async () => {
      const { visibility }: { visibility?: Visibility } =
        await chrome.storage.session.get("visibility");

      let currentVisibility = visibility?.[tabId];
      if (!currentVisibility) {
        const active = await chrome.tabs.sendMessage(tabId, {
          type: "getActive",
        });
        if (typeof active !== "boolean") {
          throw new Error(
            "The content script did not return its active state.",
          );
        }
        currentVisibility = active ? "visible" : "hidden";
      }

      const nextVisibility =
        currentVisibility === "visible" ? "hidden" : "visible";
      await chrome.storage.session.set({
        visibility: { ...visibility, [tabId]: nextVisibility },
      });
      await chrome.tabs.sendMessage(tabId, {
        type: "setActiveFromBackground",
        active: nextVisibility === "visible",
      });
    });
  } catch (error) {
    if (!isMissingMessageReceiverError(error)) {
      console.error("Extension action click failed", error);
    }
  }
};

chrome.runtime.onInstalled.addListener((details) => {
  void handleInstalled(details);
});

// Open the Floating Web Notes window when the extension icon is clicked
chrome.action.onClicked.addListener((activeTab) => {
  void handleActionClick(activeTab);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  void respondToRuntimeMessage(message, sender, sendResponse);
  return true;
});
