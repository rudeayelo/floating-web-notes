import { expect, test } from "./playwright.fixtures";

const HOST_URL = "http://localhost:6006";

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
    await page.locator("floating-web-notes .NoteEditor").fill(text);

    // Text gets saved to storage using a debounced callback every 600ms
    await page.waitForTimeout(600);

    const newPage = await context.newPage();
    await newPage.goto(HOST_URL);

    const noteEditor = newPage.locator("floating-web-notes .NoteEditor");
    await expect(noteEditor).toContainText(text);
  });

  test("it can be removed", async ({ page }) => {
    await page.locator("floating-web-notes .RemoveNoteButton").click();

    const noteContainer = page.locator("floating-web-notes .Note");
    await expect(noteContainer).not.toBeVisible();
  });

  test.describe("when attempting to change the URL pattern", () => {
    test("text in the URL pattern button matches the input", async ({
      page,
    }) => {
      await page.locator("floating-web-notes .URLPatternButtonText").click();

      await page.locator("floating-web-notes .URLPatternInput").fill("test");

      const noteURLPatternButton = page.locator(
        "floating-web-notes .URLPatternButtonText",
      );
      const noteURLPatternInput = page.locator(
        "floating-web-notes .URLPatternInput",
      );

      await expect(noteURLPatternButton).toContainText(
        await noteURLPatternInput.inputValue(),
      );
    });

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

        await page.locator("floating-web-notes .URLPatternSaveButton").click();

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

        await page.locator("floating-web-notes .URLPatternSaveButton").click();

        const noteContainer = page.locator("floating-web-notes .Note");
        await expect(noteContainer).toBeVisible();
      });
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
