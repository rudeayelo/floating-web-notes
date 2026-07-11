import { expect, test } from "@playwright/test";
import { Api, RuntimeMessageError } from "./api";

const originalChrome = Object.getOwnPropertyDescriptor(globalThis, "chrome");

const installChromeMock = (
  sendMessage: (message: unknown) => Promise<unknown>,
) => {
  Object.defineProperty(globalThis, "chrome", {
    configurable: true,
    value: { runtime: { sendMessage } },
  });
};

test.afterEach(() => {
  if (originalChrome) {
    Object.defineProperty(globalThis, "chrome", originalChrome);
    return;
  }

  Reflect.deleteProperty(globalThis, "chrome");
});

test("unwraps typed background failures into useful exceptions", async () => {
  installChromeMock(async () => ({
    ok: false,
    error: {
      code: "STORAGE_WRITE_FAILED",
      message: "Storage quota exceeded.",
    },
  }));

  const request = Api.set.note({
    id: "note-id",
    pattern: "example.com*",
    text: "Note text",
  });

  await expect(request).rejects.toBeInstanceOf(RuntimeMessageError);
  await expect(request).rejects.toMatchObject({
    code: "STORAGE_WRITE_FAILED",
    message: "setNote failed: Storage quota exceeded.",
  });
});

test("adds request context to runtime transport failures", async () => {
  installChromeMock(async () => {
    throw new Error("The message port closed.");
  });

  await expect(Api.get.notesById()).rejects.toMatchObject({
    code: "MESSAGE_SEND_FAILED",
    message:
      "getNotesById could not reach the extension background: The message port closed.",
  });
});
