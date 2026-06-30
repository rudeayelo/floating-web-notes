import type {
  Note,
  NotesExport,
  NotesImportMode,
  NotesImportResponse,
  UrlState,
  Visibility,
} from "./types";

const isMissingMessageReceiverError = (error: unknown) =>
  error instanceof Error &&
  error.message.includes("Receiving end does not exist");

const checkHotkeyConflict = (cb?: (arg0: boolean) => unknown) => {
  chrome.commands.getAll((commands) => {
    let hotkeyConflict = false;
    const missingHotkeys = [];

    for (const { name, shortcut } of commands) {
      if (shortcut === "") {
        missingHotkeys.push(name);
      }
    }

    hotkeyConflict = missingHotkeys.length > 0;

    cb?.(hotkeyConflict);
  });
};

const notesExportApp = "floating-web-notes" as const;
const notesExportSchemaVersion = 1;

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
): Promise<NotesImportResponse> => {
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

  if (mode === "replace" && existingIds.size) {
    await chrome.storage.local.remove([...existingIds]);
  }

  await chrome.storage.local.set(storageUpdate);

  return {
    ok: true,
    result: {
      imported: importedNotes.length,
      skipped,
      positionsImported: Object.keys(importedUrlState).length,
      mode,
    },
  };
};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    checkHotkeyConflict();
  }

  if (
    details.reason === chrome.runtime.OnInstalledReason.UPDATE &&
    details.previousVersion
  ) {
    chrome.storage.local.set({ previousVersion: details.previousVersion });
  }
});

// Open the Floating Web Notes window when the extension icon is clicked
chrome.action.onClicked.addListener((activeTab) => {
  const tabId = activeTab.id;
  if (!tabId) return;

  chrome.storage.session
    .get("visibility")
    .then(({ visibility }: { visibility?: Visibility }) => {
      if (visibility && visibility[tabId]) {
        chrome.storage.session.set({
          visibility: {
            ...visibility,
            [tabId]: visibility[tabId] === "visible" ? "hidden" : "visible",
          },
        });
      }
      chrome.tabs
        .sendMessage(tabId, {
          type: "toggleActive",
        })
        .catch((error: unknown) => {
          if (!isMissingMessageReceiverError(error)) {
            console.error(error);
          }
        });
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "checkHotkeyConflict") {
    checkHotkeyConflict(sendResponse);
    return true;
  }

  if (message.type === "getHotkeys") {
    chrome.commands.getAll(sendResponse);
    return true;
  }

  if (message.type === "openExtensionPage") {
    chrome.tabs
      .create({ url: "chrome://extensions/shortcuts" })
      .then(() => sendResponse(true));
    return true;
  }

  if (message.type === "reloadExtension") {
    chrome.runtime.reload();
    sendResponse(true);
    return true;
  }

  if (message.type === "getVisibility") {
    chrome.storage.session
      .get("visibility")
      .then(({ visibility }: { visibility?: Visibility }) => {
        sendResponse(
          visibility && sender.tab?.id && visibility[sender.tab?.id],
        );
      });
    return true;
  }

  if (message.type === "setVisibility") {
    chrome.storage.session
      .get("visibility")
      .then(({ visibility }: { visibility?: Visibility }) => {
        if (!sender.tab?.id) return;
        const next = visibility
          ? { ...visibility, [sender.tab.id]: message.value }
          : { [sender.tab.id]: message.value };
        chrome.storage.session
          .set({ visibility: next })
          .then(() => sendResponse(true));
      });
    return true;
  }

  if (message.type === "getOpenDefault") {
    chrome.storage.local.get("open").then(({ open }) => {
      sendResponse(open);
    });
    return true;
  }

  if (message.type === "setOpenDefault") {
    chrome.storage.local.set({ open: message.value }).then(() => {
      sendResponse(true);
    });
    return true;
  }

  if (message.type === "getTheme") {
    chrome.storage.local.get("theme").then(({ theme }) => {
      sendResponse(theme);
    });
    return true;
  }

  if (message.type === "setTheme") {
    chrome.storage.local.set({ theme: message.theme }).then(() => {
      sendResponse(true);
    });
    return true;
  }

  if (message.type === "getFirstTimeNoticeAck") {
    chrome.storage.local
      .get("firstTimeNoticeAck")
      .then(({ firstTimeNoticeAck }: { firstTimeNoticeAck?: boolean }) => {
        sendResponse(firstTimeNoticeAck || false);
      });
    return true;
  }

  // Drag handle discovery flag
  if (message.type === "getDragHandleDiscovered") {
    chrome.storage.local
      .get("dragHandleDiscovered")
      .then(({ dragHandleDiscovered }) => {
        sendResponse(Boolean(dragHandleDiscovered));
      });
    return true;
  }

  if (message.type === "setDragHandleDiscovered") {
    chrome.storage.local
      .set({ dragHandleDiscovered: Boolean(message.value) })
      .then(() => sendResponse(true));
    return true;
  }

  if (message.type === "setFirstTimeNoticeAck") {
    chrome.storage.local.set({ firstTimeNoticeAck: message.value }).then(() => {
      sendResponse(true);
    });
    return true;
  }

  if (message.type === "getNotesById") {
    chrome.storage.local.get("notesById").then(({ notesById }) => {
      sendResponse(notesById || []);
    });
    return true;
  }

  if (message.type === "getAllNotes") {
    chrome.storage.local.get("notesById").then(({ notesById }) => {
      chrome.storage.local.get(notesById || []).then((notes) => {
        sendResponse(Object.values(notes));
      });
    });
    return true;
  }

  if (message.type === "exportNotes") {
    createNotesExport().then(sendResponse);
    return true;
  }

  if (message.type === "importNotes") {
    const mode = message.mode === "replace" ? "replace" : "merge";
    importNotes(message.exportData, mode).then(sendResponse);
    return true;
  }

  if (message.type === "getNote") {
    chrome.storage.local.get(message.id).then((result) => {
      sendResponse(result[message.id]);
    });
    return true;
  }

  if (message.type === "setNotesById") {
    chrome.storage.local.set({ notesById: message.notesById }).then(() => {
      sendResponse(true);
    });
    return true;
  }

  if (message.type === "setNote") {
    // Persist note and ensure notesById includes the id (idempotent)
    chrome.storage.local.get("notesById").then(({ notesById }) => {
      const ids: string[] = Array.isArray(notesById) ? notesById : [];
      const hasId = ids.includes(message.id);
      const newIds = hasId ? ids : [...ids, message.id];

      chrome.storage.local
        .set({
          [message.id]: {
            id: message.id,
            pattern: message.pattern,
            text: message.text,
          },
          notesById: newIds,
        })
        .then(() => {
          sendResponse({ ok: true, id: message.id });
        });
    });
    return true;
  }

  if (message.type === "removeNote") {
    // Remove note id from index and delete the note entry
    chrome.storage.local.get("notesById").then(({ notesById }) => {
      const ids: string[] = Array.isArray(notesById) ? notesById : [];
      const newIds = ids.filter((id) => id !== message.id);

      chrome.storage.local.set({ notesById: newIds }).then(() => {
        chrome.storage.local.remove(message.id).then(() => {
          sendResponse(true);
        });
      });
    });
    return true;
  }

  if (message.type === "getPosition") {
    chrome.storage.local
      .get("urlState")
      .then(({ urlState }: { urlState?: UrlState }) => {
        const position = urlState?.[message.url]?.position;
        sendResponse(position);
      });

    return true;
  }

  if (message.type === "setPosition") {
    chrome.storage.local
      .get("urlState")
      .then(({ urlState }: { urlState?: UrlState }) => {
        chrome.storage.local
          .set({
            urlState: {
              ...urlState,
              [message.url]: { position: message.position },
            },
          })
          .then(() => {
            sendResponse(true);
          });
      });

    return true;
  }

  if (message.type === "removePosition") {
    chrome.storage.local
      .get("urlState")
      .then(({ urlState }: { urlState?: UrlState }) => {
        const newUrlState = { ...urlState };
        delete newUrlState[message.url];
        chrome.storage.local
          .set({
            urlState: newUrlState,
          })
          .then(() => {
            sendResponse(true);
          });
      });

    return true;
  }

  if (message.type === "getPreviousVersion") {
    chrome.storage.local.get("previousVersion").then(({ previousVersion }) => {
      sendResponse(previousVersion || null);
    });
    return true;
  }

  if (message.type === "setPreviousVersion") {
    const value = String(message.value ?? "");
    chrome.storage.local
      .set({ previousVersion: value })
      .then(() => sendResponse(true));
    return true;
  }
});
