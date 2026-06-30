import fs from "node:fs/promises";
import type { BrowserContext, Locator, Page } from "@playwright/test";
import { expect, test } from "./playwright.fixtures";
import type { NotesExport, UrlState } from "./types";

const HOST_URL = "http://localhost:6006";
const HOST_CLEAN_URL = "http://localhost:6006/";

const getServiceWorker = async (context: BrowserContext) => {
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker");
  }

  return serviceWorker;
};

const installScrollablePageFixture = async (page: Page) => {
  await page.addStyleTag({
    content: `
      html,
      body {
        height: 100%;
      }

      body {
        overflow-y: auto;
      }

      .fwn-scroll-fixture {
        box-sizing: border-box;
        min-height: 2800px;
        padding: 32px;
        background: linear-gradient(#f7f2e8, #d9eef0);
      }

      .fwn-scroll-fixture__target {
        margin-top: 1500px;
        height: 360px;
        border: 4px solid #2563eb;
      }
    `,
  });

  await page.evaluate(() => {
    if (document.querySelector(".fwn-scroll-fixture")) return;

    const fixture = document.createElement("main");
    fixture.className = "fwn-scroll-fixture";
    fixture.innerHTML =
      '<section class="fwn-scroll-fixture__target"></section>';
    document.body.prepend(fixture);
  });
};

const dragHandleToPanelTop = async ({
  page,
  container,
  handle,
  top,
  left,
}: {
  page: Page;
  container: Locator;
  handle: Locator;
  top: number;
  left: number;
}) => {
  const containerBox = await container.boundingBox();
  if (!containerBox) throw new Error("Container bounding box not found");

  const handleBox = await handle.boundingBox();
  if (!handleBox) throw new Error("Header handle bounding box not found");

  const handleOffsetX = handleBox.x + handleBox.width / 2 - containerBox.x;
  const handleOffsetY = handleBox.y + handleBox.height / 2 - containerBox.y;

  await handle.hover();
  await page.mouse.down();
  await page.mouse.move(left + handleOffsetX, top + handleOffsetY, {
    steps: 12,
  });
  await page.mouse.up();
};

const togglePanelFromExtension = async (page: Page) => {
  const context = page.context();
  const serviceWorker = await getServiceWorker(context);

  await serviceWorker.evaluate(async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      throw new Error("Active tab not found");
    }

    await chrome.tabs.sendMessage(tab.id, { type: "toggleActive" });
  });
};

test("the main window renders successfully", async ({ page }) => {
  await page.goto(HOST_URL);
  await expect(page.locator("floating-web-notes #root")).toHaveCount(1);
});

test.describe("the onboarding alert", () => {
  test("shows up in all pages if not dismissed", async ({ page }) => {
    await page.goto(HOST_URL);

    const onboardingAlert = page.locator("floating-web-notes .FirstTimeGuide");
    await expect(onboardingAlert).toBeVisible();

    await page.locator("floating-web-notes .NewWholeWebsiteNote").click();
    await expect(onboardingAlert).toBeVisible();

    await page.locator("floating-web-notes #Settings").click();
    await page.locator("floating-web-notes #HelpMenuItem").click();
    await expect(onboardingAlert).toBeVisible();
  });

  test('is dismissed by clicking on the "Got it!" button', async ({ page }) => {
    await page.goto(HOST_URL);

    const onboardingAlert = page.locator("floating-web-notes .FirstTimeGuide");
    await expect(onboardingAlert).toBeVisible();

    await page
      .locator("floating-web-notes")
      .getByRole("button", { name: "Got it!" })
      .click();

    await expect(onboardingAlert).not.toBeVisible();
  });
});

test.describe("when no notes exist for the current page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOST_URL);
    await page
      .locator("floating-web-notes")
      .getByRole("button", { name: "Got it!" })
      .click();
  });

  test.describe("a whole website note can be created", () => {
    test('by clicking on the "...for this whole website" button', async ({
      page,
    }) => {
      await page.locator("floating-web-notes .NewWholeWebsiteNote").click();

      const noteContainer = page.locator("floating-web-notes .Note");
      await expect(noteContainer).toBeVisible();

      const noteURLPatternButtonText = noteContainer.locator(
        ".URLPatternButtonText",
      );
      await expect(noteURLPatternButtonText).toContainText("*");
    });

    test('by pressing "Enter"', async ({ page }) => {
      await page.keyboard.press("Enter");

      const noteContainer = page.locator("floating-web-notes .Note");
      await expect(noteContainer).toBeVisible();

      const noteURLPatternButtonText = noteContainer.locator(
        ".URLPatternButtonText",
      );
      await expect(noteURLPatternButtonText).toContainText("*");
    });
  });

  test.describe("an exact page note can be created", () => {
    test('by clicking on the "...for this exact page" button', async ({
      page,
    }) => {
      await page.locator("floating-web-notes .NewExactPatternNote").click();

      const noteContainer = page.locator("floating-web-notes .Note");
      await expect(noteContainer).toBeVisible();

      const noteURLPatternButtonText = noteContainer.locator(
        ".URLPatternButtonText",
      );
      await expect(noteURLPatternButtonText).not.toContainText("*");
    });

    test('by pressing "Shift + Enter"', async ({ page }) => {
      await page.keyboard.down("Shift");
      await page.keyboard.press("Enter");
      await page.keyboard.up("Shift");

      const noteContainer = page.locator("floating-web-notes .Note");
      await expect(noteContainer).toBeVisible();

      const noteURLPatternButtonText = noteContainer.locator(
        ".URLPatternButtonText",
      );
      await expect(noteURLPatternButtonText).not.toContainText("*");
    });
  });
});

test.describe("when a note exists for the current page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOST_URL);
    await page
      .locator("floating-web-notes")
      .getByRole("button", { name: "Got it!" })
      .click();
    await page.locator("floating-web-notes .NewWholeWebsiteNote").click();
  });

  test("it holds the expected content", async ({ page, context }) => {
    const text = "Hello World!";
    await page
      .locator("floating-web-notes .NoteEditor > [data-typist-editor='true']")
      .fill(text);

    // Text gets saved to storage using a debounced callback every 600ms
    await page.waitForTimeout(600);

    const newPage = await context.newPage();
    await newPage.goto(HOST_URL);

    const noteEditor = newPage.locator("floating-web-notes .NoteEditor");
    await expect(noteEditor).toContainText(text);
  });

  test("editor keystrokes do not reach host page keyboard listeners", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const keyEvents: string[] = [];
      Object.assign(window, { __fwnKeyEvents: keyEvents });

      for (const eventName of ["keydown", "keypress", "keyup"]) {
        document.addEventListener(eventName, (event) => {
          keyEvents.push(`${eventName}:${(event as KeyboardEvent).key}`);
        });
      }
    });

    const noteEditor = page.locator(
      "floating-web-notes .NoteEditor > [data-typist-editor='true']",
    );
    await noteEditor.click();
    await page.keyboard.type("g");

    await expect(noteEditor).toContainText("g");
    const hostPageKeyEvents = await page.evaluate(
      () => (window as unknown as { __fwnKeyEvents: string[] }).__fwnKeyEvents,
    );
    expect(hostPageKeyEvents).toEqual([]);
  });

  test("it can be removed", async ({ page }) => {
    await page.locator("floating-web-notes .RemoveNoteButton").click();

    const noteContainer = page.locator("floating-web-notes .Note");
    await expect(noteContainer).not.toBeVisible();
  });

  test.describe("when attempting to change the URL pattern", () => {
    test.describe("when the pattern doesn't match the current URL", () => {
      test("a warning is shown and can be undone", async ({ page }) => {
        await page.locator("floating-web-notes .URLPatternButtonText").click();

        const noteURLPatternButton = page.locator(
          "floating-web-notes .URLPatternButtonText",
        );
        const initialPattern = await noteURLPatternButton.textContent();

        await page.locator("floating-web-notes .URLPatternInput").fill("test");

        const warning = page.locator("floating-web-notes .InputHelper");
        await expect(warning).toBeVisible();

        await page
          .locator("floating-web-notes .URLPatternUndoChangeButton")
          .click();

        await expect(noteURLPatternButton).toContainText(initialPattern || "");
      });

      test("saving the pattern makes the note dissappear", async ({ page }) => {
        await page.locator("floating-web-notes .URLPatternButtonText").click();

        await page.locator("floating-web-notes .URLPatternInput").fill("test");

        const warning = page.locator("floating-web-notes .InputHelper");
        await expect(warning).toBeVisible();

        await page.locator("floating-web-notes .NeutralButton").click();

        const noteContainer = page.locator("floating-web-notes .Note");
        await expect(noteContainer).not.toBeVisible();
      });
    });

    test.describe("when the pattern matches the current URL", () => {
      test("saving the pattern has no effect on the visibility of the note", async ({
        page,
      }) => {
        const newPattern = "localhost*";

        await page.locator("floating-web-notes .URLPatternButtonText").click();

        await page
          .locator("floating-web-notes .URLPatternInput")
          .fill(newPattern);

        const warning = page.locator("floating-web-notes .InputHelper");
        await expect(warning).not.toBeVisible();

        await page.locator("floating-web-notes .NeutralButton").click();

        const noteContainer = page.locator("floating-web-notes .Note");
        await expect(noteContainer).toBeVisible();
      });
    });
  });
});

test.describe("dev note import/export", () => {
  test("exports notes and page positions in the backup format", async ({
    page,
    context,
  }) => {
    await page.goto(HOST_URL);
    await page
      .locator("floating-web-notes")
      .getByRole("button", { name: "Got it!" })
      .click();
    await page.locator("floating-web-notes .NewWholeWebsiteNote").click();

    const text = "Exported note content";
    await page
      .locator("floating-web-notes .NoteEditor > [data-typist-editor='true']")
      .fill(text);
    await page.waitForTimeout(600);

    const serviceWorker = await getServiceWorker(context);
    await serviceWorker.evaluate(async () => {
      await chrome.storage.local.set({
        urlState: {
          "http://localhost:6006/": { position: { x: 123, y: 456 } },
        },
      });
    });

    await page.locator("floating-web-notes #Settings").click();
    const downloadPromise = page.waitForEvent("download");
    await page.locator("floating-web-notes #ExportNotesMenuItem").click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("Export download path was not found");

    const notesExport = JSON.parse(
      await fs.readFile(downloadPath, "utf8"),
    ) as NotesExport;

    expect(notesExport).toMatchObject({
      app: "floating-web-notes",
      schemaVersion: 1,
    });
    expect(notesExport.exportedAt).toEqual(expect.any(String));
    expect(notesExport.notes).toHaveLength(1);
    expect(notesExport.notes[0]).toMatchObject({
      pattern: "localhost:6006*",
      text,
    });
    expect(notesExport.urlState[HOST_CLEAN_URL]?.position).toEqual({
      x: 123,
      y: 456,
    });

    await page.locator("floating-web-notes #Settings").click();
    await expect(
      page.locator("floating-web-notes #ReplaceNotesMenuItem"),
    ).toHaveCount(0);
  });

  test("imports notes by merging them with existing storage", async ({
    page,
    context,
  }) => {
    await page.goto(HOST_URL);
    const serviceWorker = await getServiceWorker(context);

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.locator("floating-web-notes #Settings").click();
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.locator("floating-web-notes #ImportNotesMenuItem").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "floating-web-notes.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          app: "floating-web-notes",
          schemaVersion: 1,
          exportedAt: "2026-06-29T00:00:00.000Z",
          urlState: {
            [HOST_CLEAN_URL]: { position: { x: 222, y: 333 } },
          },
          notes: [
            {
              id: "imported-note",
              pattern: "localhost*",
              text: "Imported note content",
            },
          ],
        }),
      ),
    });

    await expect(
      page.locator("floating-web-notes #ImportNotesDialog"),
    ).toBeVisible();
    await page.locator("floating-web-notes #ImportNotesAddButton").click();

    await expect(page.locator("floating-web-notes .NoteEditor")).toContainText(
      "Imported note content",
    );
    const storage = (await serviceWorker.evaluate(async () => {
      return chrome.storage.local.get("urlState");
    })) as { urlState: UrlState };
    expect(storage.urlState[HOST_CLEAN_URL]).toEqual({
      position: { x: 222, y: 333 },
    });
  });

  test("replace imports remove existing notes", async ({ page, context }) => {
    await page.goto(HOST_URL);

    const serviceWorker = await getServiceWorker(context);
    const result = await serviceWorker.evaluate(async () => {
      await chrome.storage.local.set({
        notesById: ["old-note"],
        urlState: {
          "http://localhost:6006/": { position: { x: 10, y: 20 } },
          "https://old.example/": { position: { x: 30, y: 40 } },
        },
        "old-note": {
          id: "old-note",
          pattern: "localhost*",
          text: "Old note content",
        },
      });

      return chrome.storage.local.get(["notesById", "old-note"]);
    });

    expect(result.notesById).toEqual(["old-note"]);

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.locator("floating-web-notes #Settings").click();
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.locator("floating-web-notes #ImportNotesMenuItem").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "floating-web-notes.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          app: "floating-web-notes",
          schemaVersion: 1,
          exportedAt: "2026-06-29T00:00:00.000Z",
          urlState: {
            [HOST_CLEAN_URL]: { position: { x: 444, y: 555 } },
          },
          notes: [
            {
              id: "replacement-note",
              pattern: "localhost*",
              text: "Replacement note content",
            },
          ],
        }),
      ),
    });

    await expect(
      page.locator("floating-web-notes #ImportNotesDialog"),
    ).toBeVisible();
    await page.locator("floating-web-notes #ImportNotesReplaceButton").click();

    await expect
      .poll(async () => {
        return serviceWorker.evaluate(async () => {
          const { notesById } = await chrome.storage.local.get("notesById");
          return notesById;
        });
      })
      .toEqual(["replacement-note"]);

    const storage = await serviceWorker.evaluate(async () => {
      return chrome.storage.local.get([
        "notesById",
        "urlState",
        "old-note",
        "replacement-note",
      ]);
    });

    expect(storage.notesById).toEqual(["replacement-note"]);
    expect(storage["old-note"]).toBeUndefined();
    expect(storage["replacement-note"]).toMatchObject({
      text: "Replacement note content",
    });
    expect(storage.urlState).toEqual({
      [HOST_CLEAN_URL]: { position: { x: 444, y: 555 } },
    });
  });

  test("invalid imports do not mutate storage", async ({ page, context }) => {
    await page.goto(HOST_URL);

    const serviceWorker = await getServiceWorker(context);
    const result = await serviceWorker.evaluate(async () => {
      await chrome.storage.local.set({
        notesById: ["existing-note"],
        "existing-note": {
          id: "existing-note",
          pattern: "localhost*",
          text: "Existing note content",
        },
      });

      return chrome.storage.local.get(["notesById", "existing-note"]);
    });

    expect(result.notesById).toEqual(["existing-note"]);

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.locator("floating-web-notes #Settings").click();
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.locator("floating-web-notes #ImportNotesMenuItem").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "floating-web-notes.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          app: "some-other-app",
          schemaVersion: 1,
          notes: [],
        }),
      ),
    });

    await expect(
      page.locator("floating-web-notes #ImportNotesDialog"),
    ).toHaveCount(0);

    const storage = await serviceWorker.evaluate(async () => {
      return chrome.storage.local.get(["notesById", "existing-note"]);
    });

    expect(storage.notesById).toEqual(["existing-note"]);
    expect(storage["existing-note"]).toMatchObject({
      text: "Existing note content",
    });
  });
});

test.describe("when the user intends to change the keyboard shortcut", () => {
  test("the browser's extension page is opened", async ({ page, context }) => {
    await page.goto(HOST_URL);
    const pagePromise = context.waitForEvent("page");
    await page.locator("floating-web-notes .BrowserExtensionSettings").click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    expect(newPage.url()).toBe("chrome://extensions/shortcuts");
  });
});

test.describe("when the keyboard shortcut is used", () => {
  test.skip("it should toggle the main window", async ({ page }) => {
    await page.goto(HOST_URL);
    await page
      .locator("floating-web-notes")
      .getByRole("button", { name: "Got it!" })
      .click();

    await expect(page.locator("floating-web-notes #root")).toHaveCount(1);

    await page.keyboard.press("Control+n");

    await expect(page.locator("floating-web-notes #root")).toBeFalsy();

    await page.keyboard.press("Control+n");

    await expect(page.locator("floating-web-notes #root")).toHaveCount(1);
  });
});

test.describe('when the "Open by default" setting is set to...', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOST_URL);
    await page
      .locator("floating-web-notes")
      .getByRole("button", { name: "Got it!" })
      .click();
  });

  test.describe('..."Never"', () => {
    test("the main window is hidden on page load", async ({
      page,
      context,
    }) => {
      await page.locator("floating-web-notes #Settings").click();
      await page
        .locator("floating-web-notes #open-default-option-never")
        .click();

      const newPage = await context.newPage();
      await newPage.goto(HOST_URL);

      await expect(
        newPage.locator("floating-web-notes #root"),
      ).not.toBeVisible();
    });
  });

  test.describe('..."On every website"', () => {
    test("the main window is visible on page load", async ({
      page,
      context,
    }) => {
      await page.locator("floating-web-notes #Settings").click();
      await page
        .locator("floating-web-notes #open-default-option-always")
        .click();

      // Allow time for the setting to be saved before loading a new page.
      await page.waitForTimeout(100);

      const newPage = await context.newPage();
      await newPage.goto(HOST_URL);

      await expect(newPage.locator("floating-web-notes #root")).toHaveCount(1);
    });
  });

  test.describe('..."Only when there\'s a note"', () => {
    test("with no notes, the main window is hidden", async ({
      page,
      context,
    }) => {
      await page.locator("floating-web-notes #Settings").click();
      await page
        .locator("floating-web-notes #open-default-option-with-notes")
        .click();

      const newPage = await context.newPage();
      await newPage.goto(HOST_URL);

      await expect(newPage.locator("floating-web-notes #root")).toHaveCount(0);
    });

    test("with notes, the main window is visible", async ({
      page,
      context,
    }) => {
      await page.locator("floating-web-notes .NewWholeWebsiteNote").click();

      await page.locator("floating-web-notes #Settings").click();
      await page
        .locator("floating-web-notes #open-default-option-with-notes")
        .click();

      const newPage = await context.newPage();
      await newPage.goto(HOST_URL);

      await expect(newPage.locator("floating-web-notes .Note")).toBeVisible();
    });
  });
});

test.describe("theme setting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOST_URL);
  });

  test("applies and persists dark mode", async ({ page, context }) => {
    await page.locator("floating-web-notes #Settings").click();
    await page.locator("floating-web-notes #theme-option-dark").click();

    const root = page.locator("floating-web-notes #root");
    await expect(root).toHaveAttribute("data-theme-setting", "dark");
    await expect(root).toHaveAttribute("data-theme", "dark");

    const newPage = await context.newPage();
    await newPage.goto(HOST_URL);

    const persistedRoot = newPage.locator("floating-web-notes #root");
    await expect(persistedRoot).toHaveAttribute("data-theme-setting", "dark");
    await expect(persistedRoot).toHaveAttribute("data-theme", "dark");
  });

  test("resolves system mode from the browser color scheme", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });

    await page.locator("floating-web-notes #Settings").click();
    await page.locator("floating-web-notes #theme-option-system").click();

    const root = page.locator("floating-web-notes #root");
    await expect(root).toHaveAttribute("data-theme-setting", "system");
    await expect(root).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("panel repositioning", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOST_URL);
  });

  test("dragging the header handle updates position and persists after reload", async ({
    page,
  }) => {
    const container = page.locator("floating-web-notes .Container");
    const handle = page.locator("floating-web-notes .HeaderHandle");

    const before = await container.boundingBox();
    if (!before)
      throw new Error("Container bounding box not found before drag");

    // Drag by an offset
    const hbox = await handle.boundingBox();
    if (!hbox) throw new Error("Header handle bounding box not found");
    // Use documented manual dragging sequence: hover -> down -> move -> up
    await handle.hover();
    await page.mouse.down();
    await page.mouse.move(
      hbox.x + hbox.width / 2 - 80,
      hbox.y + hbox.height / 2 + 60,
      {
        steps: 10,
      },
    );
    await page.mouse.up();

    const after = await container.boundingBox();
    if (!after) throw new Error("Container bounding box not found after drag");
    expect(Math.abs((after.x ?? 0) - (before.x ?? 0))).toBeGreaterThan(10);
    expect(Math.abs((after.y ?? 0) - (before.y ?? 0))).toBeGreaterThan(10);

    // Reload and verify the position sticks
    await page.reload();
    const persisted = await page
      .locator("floating-web-notes .Container")
      .boundingBox();
    if (!persisted)
      throw new Error("Container bounding box not found after reload");
    expect(Math.abs((persisted.x ?? 0) - (after.x ?? 0))).toBeLessThan(3);
    expect(Math.abs((persisted.y ?? 0) - (after.y ?? 0))).toBeLessThan(3);
  });

  test("restore button appears after drag and restores default position", async ({
    page,
  }) => {
    const container = page.locator("floating-web-notes .Container");
    const handle = page.locator("floating-web-notes .HeaderHandle");

    // Ensure custom position by dragging a bit
    const hbox = await handle.boundingBox();
    if (!hbox) throw new Error("Header handle bounding box not found");
    // Option A: manual dragging sequence
    await handle.hover();
    await page.mouse.down();
    await page.mouse.move(
      hbox.x + hbox.width / 2 - 40,
      hbox.y + hbox.height / 2 + 30,
      { steps: 10 },
    );
    await page.mouse.up();

    // The restore button should appear
    const restoreBtn = page.locator(
      "floating-web-notes #RestorePositionButton",
    );
    await expect(restoreBtn).toBeVisible();

    await restoreBtn.hover();
    const restoreTooltip = page
      .locator("floating-web-notes .TooltipContent")
      .filter({ hasText: "Restore position" });
    await expect(restoreTooltip).toBeVisible();
    await page.waitForTimeout(500);
    await expect(restoreTooltip).toBeVisible();

    // Capture current position and then restore
    const dragged = await container.boundingBox();
    if (!dragged)
      throw new Error("Container bounding box not found after drag");
    await restoreBtn.click();

    // After restore, root coordinate mode should be back to fixed/default.
    await expect(page.locator("floating-web-notes #root")).toHaveAttribute(
      "data-custom-position",
      "false",
    );

    const restored = await container.boundingBox();
    if (!restored)
      throw new Error("Container bounding box not found after restore");

    // Position should move significantly back from dragged location
    const delta = Math.hypot(
      (restored.x ?? 0) - (dragged.x ?? 0),
      (restored.y ?? 0) - (dragged.y ?? 0),
    );
    expect(delta).toBeGreaterThan(20);

    // Restore button disappears when back to default
    await expect(restoreBtn).toHaveCount(0);
  });

  test("can be dragged near the visible bottom when html and body are height 100%", async ({
    page,
  }) => {
    await installScrollablePageFixture(page);
    await page.evaluate(() => window.scrollTo(0, 1200));

    const container = page.locator("floating-web-notes .Container");
    const handle = page.locator("floating-web-notes .HeaderHandle");
    const targetTop = 560;

    await dragHandleToPanelTop({
      page,
      container,
      handle,
      top: targetTop,
      left: 240,
    });

    const after = await container.boundingBox();
    if (!after) throw new Error("Container bounding box not found after drag");

    expect(after.y).toBeGreaterThan(500);
    expect(Math.abs(after.y - targetTop)).toBeLessThan(8);
  });

  test("stores page coordinates when dropped after scrolling", async ({
    page,
  }) => {
    await installScrollablePageFixture(page);
    await page.evaluate(() => window.scrollTo(0, 1200));

    const container = page.locator("floating-web-notes .Container");
    const handle = page.locator("floating-web-notes .HeaderHandle");
    const targetTop = 420;
    const targetLeft = 220;

    await dragHandleToPanelTop({
      page,
      container,
      handle,
      top: targetTop,
      left: targetLeft,
    });

    const dropped = await container.boundingBox();
    if (!dropped)
      throw new Error("Container bounding box not found after scroll drag");

    expect(Math.abs(dropped.x - targetLeft)).toBeLessThan(8);
    expect(Math.abs(dropped.y - targetTop)).toBeLessThan(8);

    await page.reload();
    await installScrollablePageFixture(page);
    await page.evaluate(() => window.scrollTo(0, 1200));

    const persisted = await page
      .locator("floating-web-notes .Container")
      .boundingBox();
    if (!persisted)
      throw new Error("Container bounding box not found after reload");

    expect(Math.abs(persisted.x - dropped.x)).toBeLessThan(8);
    expect(Math.abs(persisted.y - dropped.y)).toBeLessThan(8);
  });

  test("default position stays fixed when toggled after scrolling", async ({
    page,
  }) => {
    await installScrollablePageFixture(page);

    const container = page.locator("floating-web-notes .Container");
    const closeButton = page.locator("floating-web-notes #CloseButton");

    const before = await container.boundingBox();
    if (!before)
      throw new Error("Container bounding box not found before scroll toggle");

    await closeButton.click();
    await expect(container).toHaveCount(0);

    await page.evaluate(() => window.scrollTo(0, 180));
    await togglePanelFromExtension(page);
    await expect(container).toBeVisible();

    const reopened = await container.boundingBox();
    if (!reopened)
      throw new Error("Container bounding box not found after scroll toggle");

    expect(Math.abs(reopened.x - before.x)).toBeLessThan(3);
    expect(Math.abs(reopened.y - before.y)).toBeLessThan(3);
    expect(reopened.y).toBeGreaterThanOrEqual(0);
  });
});
