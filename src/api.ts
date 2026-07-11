import type {
  Command,
  Note,
  NotesExport,
  NotesImportMode,
  NotesImportResponse,
  OpenOptions,
  Position,
  RuntimeMessageResponse,
  ThemeOptions,
} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export class RuntimeMessageError extends Error {
  readonly code: string;
  readonly cause?: unknown;

  constructor(code: string, message: string, cause?: unknown) {
    super(message);
    this.name = "RuntimeMessageError";
    this.code = code;
    this.cause = cause;
  }
}

const sendMessage = async <T>(message: {
  type: string;
  [key: string]: unknown;
}): Promise<T> => {
  let response: unknown;

  try {
    response = await chrome.runtime.sendMessage(message);
  } catch (error) {
    throw new RuntimeMessageError(
      "MESSAGE_SEND_FAILED",
      `${message.type} could not reach the extension background: ${getErrorMessage(error)}`,
      error,
    );
  }

  if (!isRecord(response) || typeof response.ok !== "boolean") {
    throw new RuntimeMessageError(
      "INVALID_RESPONSE",
      `${message.type} returned an invalid response from the extension background.`,
    );
  }

  const runtimeResponse = response as RuntimeMessageResponse<T>;
  if (!runtimeResponse.ok) {
    const error = runtimeResponse.error;
    throw new RuntimeMessageError(
      error?.code || "BACKGROUND_ERROR",
      `${message.type} failed: ${error?.message || "Unknown background error."}`,
    );
  }

  return runtimeResponse.data;
};

const sendCommand = async (message: {
  type: string;
  [key: string]: unknown;
}): Promise<void> => {
  await sendMessage<true>(message);
};

export const Api = {
  get: {
    previousVersion: (): Promise<string | null> => {
      return sendMessage({ type: "getPreviousVersion" });
    },
    firstTimeNoticeAck: (): Promise<boolean> => {
      return sendMessage({ type: "getFirstTimeNoticeAck" });
    },
    openDefault: (): Promise<OpenOptions> => {
      return sendMessage({ type: "getOpenDefault" });
    },
    visibility: (): Promise<"visible" | "hidden"> => {
      return sendMessage({ type: "getVisibility" });
    },
    theme: (): Promise<ThemeOptions> => {
      return sendMessage({ type: "getTheme" });
    },
    hotkeys: (): Promise<Command[]> => {
      return sendMessage({ type: "getHotkeys" });
    },
    hotkeyConflict: (): Promise<boolean> => {
      return sendMessage({ type: "checkHotkeyConflict" });
    },
    notesById: (): Promise<string[]> => {
      return sendMessage({ type: "getNotesById" });
    },
    allNotes: (): Promise<Note[]> => {
      return sendMessage({ type: "getAllNotes" });
    },
    notesExport: (): Promise<NotesExport> => {
      return sendMessage({ type: "exportNotes" });
    },
    note: (id: string): Promise<Note> => {
      return sendMessage({ type: "getNote", id });
    },
    position: (url: string): Promise<Position> => {
      return sendMessage({ type: "getPosition", url });
    },
    dragHandleDiscovered: (): Promise<boolean> => {
      return sendMessage({ type: "getDragHandleDiscovered" });
    },
  },
  set: {
    visibility: (value: "visible" | "hidden") => {
      return sendCommand({ type: "setVisibility", value });
    },
    openDefault: (value: OpenOptions) => {
      return sendCommand({ type: "setOpenDefault", value });
    },
    theme: (theme: ThemeOptions) => {
      return sendCommand({ type: "setTheme", theme });
    },
    previousVersion: (value: string) => {
      return sendCommand({ type: "setPreviousVersion", value });
    },
    firstTimeNoticeAck: (value: boolean) => {
      return sendCommand({ type: "setFirstTimeNoticeAck", value });
    },
    note: ({ id, pattern, text }: Note) => {
      return sendCommand({ type: "setNote", id, pattern, text });
    },
    notesImport: (
      exportData: unknown,
      mode: NotesImportMode,
    ): Promise<NotesImportResponse> => {
      return sendMessage({ type: "importNotes", exportData, mode });
    },
    position: (url: string, position: Position) => {
      return sendCommand({ type: "setPosition", url, position });
    },
    dragHandleDiscovered: (value: boolean) => {
      return sendCommand({ type: "setDragHandleDiscovered", value });
    },
  },
  remove: {
    note: (id: string) => {
      return sendCommand({ type: "removeNote", id });
    },
    position: (url: string) => {
      return sendCommand({ type: "removePosition", url });
    },
  },
  do: {
    openExtensionPage: () => {
      return sendCommand({ type: "openExtensionPage" });
    },
    reloadExtension: () => {
      return sendCommand({ type: "reloadExtension" });
    },
  },
};
