import puppeteer, { type Browser, type Page } from "puppeteer";

const EXTENSION_PATH = "dist";
const HOST_URL = "localhost:6006";

let browser: Browser | undefined;

/* -------------------------------------------------------------------------- */
/*                                  Selectors                                 */
/* -------------------------------------------------------------------------- */

const selectors = {
  shadowRoot: "floating-web-notes >>> #root",
  closeButton: "floating-web-notes >>> .CloseButton",
  onboardingAlert: "floating-web-notes >>> .FirstTimeGuide",
  onboardingAlertDismissButton: "floating-web-notes >>> .AlertActionButton",
  createWholeWebsiteNoteButton: "floating-web-notes >>> .NewWholeWebsiteNote",
  createExactPatternNoteButton: "floating-web-notes >>> .NewExactPatternNote",
  settingsButton: "floating-web-notes >>> #Settings",
  helpMenuItemButton: "floating-web-notes >>> #HelpMenuItem",
  browserExtensionSettingsButton:
    "floating-web-notes >>> .BrowserExtensionSettings",
  noteContainer: "floating-web-notes >>> .Note",
  noteEditor: "floating-web-notes >>> .NoteEditor",
  noteURLPatternButton: "floating-web-notes >>> .URLPatternButtonText",
  noteURLPatternInput: "floating-web-notes >>> .URLPatternInput",
  noteURLPatternWarning: "floating-web-notes >>> .InputHelper",
  noteURLPatternSaveButton: "floating-web-notes >>> .URLPatternSaveButton",
  noteURLPatternUndoButton:
    "floating-web-notes >>> .URLPatternUndoChangeButton",
  noteRemoveButton: "floating-web-notes >>> .RemoveNoteButton",
  settingsOpenDefaultAlways:
    "floating-web-notes >>> #open-default-option-always",
  settingsOpenDefaultNever: "floating-web-notes >>> #open-default-option-never",
  settingsOpenDefaultWithNotes:
    "floating-web-notes >>> #open-default-option-with-notes",
} as const;

/* -------------------------------------------------------------------------- */
/*                               Util functions                               */
/* -------------------------------------------------------------------------- */

const loadPage = async () => {
  const page = await browser?.newPage();
  await page?.goto(`http://${HOST_URL}`);
  await page?.waitForNetworkIdle({ idleTime: 500 });

  return page as Page;
};

const dismissOnboarding = async (page: Page) => {
  const onboardingAlertDismissButton = await page.waitForSelector(
    selectors.onboardingAlertDismissButton,
  );
  await onboardingAlertDismissButton?.click();
};

const clickOn = async (page: Page, selector: string) => {
  await page.waitForSelector(selectors.shadowRoot);
  const handle = await page.waitForSelector(selector);
  await handle?.click();
};

const getSelector = async (page: Page, selector: string) => {
  await page.waitForSelector(selectors.shadowRoot);
  return page.waitForSelector(selector);
};

const sleep = async (time: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

/* -------------------------------------------------------------------------- */
/*                                    TESTS                                   */
/* -------------------------------------------------------------------------- */

beforeEach(async () => {
  browser = await puppeteer.launch({
    devtools: true,
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
    defaultViewport: {
      width: 645,
      height: 800,
    },
  });
});

describe("when the keyboard shortcut is correctly registered", () => {
  describe("when the host page loads for the first time", () => {
    test("the main window renders successfully", async () => {
      const page = await loadPage();

      const root = await page.waitForSelector(selectors.shadowRoot);

      expect(root).toBeTruthy();
    });

    test.skip("pressing the keyboard shortcut makes the main window hide", async () => {
      const page = await loadPage();

      let root = await page.waitForSelector(selectors.shadowRoot);
      expect(root).toBeTruthy();

      await page.evaluate(() => {
        document.addEventListener("keydown", (e) => console.log(e.code));
      });

      await page.keyboard.down("Alt");
      await page.keyboard.press("n");
      await page.keyboard.up("Alt");

      root = await page.waitForSelector(selectors.shadowRoot);
      expect(root).toBeFalsy();
    });

    describe("the onboarding alert", () => {
      test("shows up in all pages if not dismissed", async () => {
        const page = await loadPage();

        let onboardingAlert = await page.$(selectors.onboardingAlert);

        expect(onboardingAlert).toBeTruthy();

        await clickOn(page, selectors.createWholeWebsiteNoteButton);

        onboardingAlert = await page.$(selectors.onboardingAlert);

        expect(onboardingAlert).toBeTruthy();

        await clickOn(page, selectors.settingsButton);
        await clickOn(page, selectors.helpMenuItemButton);

        expect(onboardingAlert).toBeTruthy();
      });

      test(`is dismissed by clicking on the "Got it!" button`, async () => {
        const page = await loadPage();

        let onboardingAlert = await page.$(selectors.onboardingAlert);

        expect(onboardingAlert).toBeTruthy();

        await clickOn(page, selectors.onboardingAlertDismissButton);

        onboardingAlert = await page.$(selectors.onboardingAlert);

        expect(onboardingAlert).toBeFalsy();
      });
    });
  });

  describe(`when the "Open by default" setting is set to...`, () => {
    describe(`..."Never"`, () => {
      test("the main window is hidden on page load", async () => {
        const page = await loadPage();
        await dismissOnboarding(page);

        await clickOn(page, selectors.settingsButton);
        await clickOn(page, selectors.settingsOpenDefaultNever);

        const newPage = await loadPage();

        const fwb = await newPage.$eval("floating-web-notes", (node) =>
          node.shadowRoot?.querySelector("#root"),
        );
        expect(fwb).toBeFalsy();
      });
    });

    describe(`..."On every website"`, () => {
      test("the main window is visible on page load", async () => {
        const page = await loadPage();
        await dismissOnboarding(page);

        await clickOn(page, selectors.settingsButton);
        await clickOn(page, selectors.settingsOpenDefaultAlways);

        const newPage = await loadPage();

        const root = await newPage.waitForSelector(selectors.shadowRoot);
        expect(root).toBeTruthy();
      });
    });

    describe(`..."Only when there's a note"`, () => {
      test("with no notes, the main window is hidden", async () => {
        const page = await loadPage();
        await dismissOnboarding(page);

        await clickOn(page, selectors.settingsButton);
        await clickOn(page, selectors.settingsOpenDefaultWithNotes);

        const newPage = await loadPage();

        const fwb = await newPage.$eval("floating-web-notes", (node) =>
          node.shadowRoot?.querySelector("#root"),
        );
        expect(fwb).toBeFalsy();
      });

      test("with notes, the main window is visible", async () => {
        const page = await loadPage();
        await dismissOnboarding(page);

        await clickOn(page, selectors.createWholeWebsiteNoteButton);

        await clickOn(page, selectors.settingsButton);
        await clickOn(page, selectors.settingsOpenDefaultWithNotes);

        const newPage = await loadPage();

        const noteContainer = await getSelector(
          newPage,
          selectors.noteContainer,
        );

        expect(noteContainer).toBeTruthy();
      });
    });
  });

  describe("when no notes exist for the current page", () => {
    describe("a whole website note can be created", () => {
      test(`by clicking on the "...for this whole website" button`, async () => {
        const page = await loadPage();
        await dismissOnboarding(page);

        await clickOn(page, selectors.createWholeWebsiteNoteButton);

        const noteContainer = await getSelector(page, selectors.noteContainer);

        expect(noteContainer).toBeTruthy();

        const noteURLPatternButtonText = await noteContainer?.$eval(
          ".URLPatternButtonText",
          (node) => node.textContent,
        );

        expect(noteURLPatternButtonText).toContain("*");
      });

      test(`by pressing "Enter"`, async () => {
        const page = await loadPage();
        await dismissOnboarding(page);

        await page.keyboard.press("Enter");

        const noteContainer = await getSelector(page, selectors.noteContainer);

        expect(noteContainer).toBeTruthy();

        const noteURLPatternButtonText = await noteContainer?.$eval(
          ".URLPatternButtonText",
          (node) => node.textContent,
        );

        expect(noteURLPatternButtonText).toContain("*");
      });
    });

    describe("an exact page note can be created", () => {
      test(`by clicking on the "...for this exact page" button`, async () => {
        const page = await loadPage();
        await dismissOnboarding(page);

        await clickOn(page, selectors.createExactPatternNoteButton);

        const noteContainer = await getSelector(page, selectors.noteContainer);

        expect(noteContainer).toBeTruthy();

        const noteURLPatternButtonText = await noteContainer?.$eval(
          ".URLPatternButtonText",
          (node) => node.textContent,
        );

        expect(noteURLPatternButtonText).not.toContain("*");
      });

      test(`by pressing "Shift + Enter"`, async () => {
        const page = await loadPage();
        await dismissOnboarding(page);

        await page.keyboard.down("Shift");
        await page.keyboard.press("Enter");
        await page.keyboard.up("Shift");

        const noteContainer = await getSelector(page, selectors.noteContainer);

        expect(noteContainer).toBeTruthy();

        const noteURLPatternButtonText = await noteContainer?.$eval(
          ".URLPatternButtonText",
          (node) => node.textContent,
        );

        expect(noteURLPatternButtonText).not.toContain("*");
      });
    });
  });

  describe("when a note exists for the current page", () => {
    test("it holds the expected content", async () => {
      const page = await loadPage();
      await dismissOnboarding(page);

      const text = "Hello World!";

      await clickOn(page, selectors.createWholeWebsiteNoteButton);

      await sleep(500);

      await page.keyboard.type(text);

      // Text gets saved to storage using a debounded callback every 600ms
      await sleep(600);

      const newPage = await loadPage();

      const noteEditorText = await newPage.$eval(
        selectors.noteEditor,
        (node) => node.textContent,
      );

      expect(noteEditorText).toContain(text);
    });

    test("it can be removed", async () => {
      const page = await loadPage();
      await dismissOnboarding(page);

      await clickOn(page, selectors.createWholeWebsiteNoteButton);

      const removeNoteButton = await getSelector(
        page,
        selectors.noteRemoveButton,
      );
      await removeNoteButton?.click();

      const noteContainer = await page.$(selectors.noteContainer);

      expect(noteContainer).toBeFalsy();
    });

    describe("when attempting to change the URL pattern", () => {
      test("text in the URL pattern button matches the input", async () => {
        const page = await loadPage();
        await dismissOnboarding(page);

        await clickOn(page, selectors.createWholeWebsiteNoteButton);
        await clickOn(page, selectors.noteURLPatternButton);

        await page.focus(selectors.noteURLPatternInput);

        await page.keyboard.type("test");

        const noteURLPatternButtonText = await page.$eval(
          selectors.noteURLPatternButton,
          (node) => node.textContent,
        );
        const noteURLPatternInputValue = await page.$eval(
          selectors.noteURLPatternInput,
          // @ts-expect-error: this works perfectly fine, I guess there's a bug in the types
          (input) => input.value,
        );

        expect(noteURLPatternButtonText).toBe(noteURLPatternInputValue);
      });

      describe("when the pattern doesn't match the current URL", () => {
        test("a warning is shown and can be undone", async () => {
          const page = await loadPage();
          await dismissOnboarding(page);

          await clickOn(page, selectors.createWholeWebsiteNoteButton);
          await clickOn(page, selectors.noteURLPatternButton);

          await page.focus(selectors.noteURLPatternInput);

          const noteURLPatternButtonText = await page.$eval(
            selectors.noteURLPatternButton,
            (node) => node.textContent,
          );

          await page.keyboard.type("test");

          const warning = await getSelector(
            page,
            selectors.noteURLPatternWarning,
          );

          expect(warning).toBeTruthy();

          await clickOn(page, selectors.noteURLPatternUndoButton);

          const noteURLPatternAfterUndoButtonText = await page.$eval(
            selectors.noteURLPatternButton,
            (node) => node.textContent,
          );

          expect(noteURLPatternButtonText).toBe(
            noteURLPatternAfterUndoButtonText,
          );
        });

        test("saving the pattern makes the note dissappear", async () => {
          const page = await loadPage();
          await dismissOnboarding(page);

          await clickOn(page, selectors.createWholeWebsiteNoteButton);
          await clickOn(page, selectors.noteURLPatternButton);

          await page.focus(selectors.noteURLPatternInput);

          await page.keyboard.type("test");

          const warning = await getSelector(
            page,
            selectors.noteURLPatternWarning,
          );

          expect(warning).toBeTruthy();

          await clickOn(page, selectors.noteURLPatternSaveButton);

          const noteContainer = await page.$(selectors.noteContainer);

          expect(noteContainer).toBeFalsy();
        });
      });

      describe("when the pattern matches the current URL", () => {
        test("saving the pattern has no effect on the visibility of the note", async () => {
          const page = await loadPage();
          await dismissOnboarding(page);

          const newPattern = "localhost*";

          await clickOn(page, selectors.createWholeWebsiteNoteButton);
          await clickOn(page, selectors.noteURLPatternButton);

          await page.focus(selectors.noteURLPatternInput);

          await page.keyboard.type(newPattern);

          const warning = await page.$(selectors.noteURLPatternWarning);

          expect(warning).toBeFalsy();

          await clickOn(page, selectors.noteURLPatternSaveButton);

          const noteURLPatternButtonText = await page.$eval(
            selectors.noteURLPatternButton,
            (node) => node.textContent,
          );

          expect(noteURLPatternButtonText).toBe(newPattern);
        });
      });
    });
  });

  describe("when the user intends to change the keyboard shortcut", () => {
    test("the browser's extension page is opened", async () => {
      const page = await loadPage();
      await clickOn(page, selectors.browserExtensionSettingsButton);

      const tabs = [];

      await sleep(1000);

      const pages = await browser?.pages();
      // log each page title
      if (pages) {
        for (const page of pages) {
          await page.waitForNetworkIdle({ idleTime: 500 });
          tabs.push(await page.url());
        }
      }

      expect(tabs).toContain("chrome://extensions/shortcuts");
    });
  });
});

afterEach(async () => {
  browser && (await browser.close());
  browser = undefined;
});
