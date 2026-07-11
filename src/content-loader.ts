import { Api } from "./api";

type ContentModule = typeof import("./content");

let contentModule: ContentModule | undefined;
let contentModulePromise: Promise<ContentModule> | undefined;
let startupStatePromise:
  | ReturnType<typeof Api.get.contentStartupState>
  | undefined;
let activeBeforeLoad: boolean | undefined;

const loadContent = async (active: boolean) => {
  if (!contentModulePromise) {
    contentModulePromise = import("./content");
  }

  contentModule = await contentModulePromise;
  contentModule.mountFloatingWebNotes(active);
  return contentModule;
};

const getStartupState = async () => {
  if (!startupStatePromise) {
    startupStatePromise = Api.get.contentStartupState(window.location.href);
  }

  try {
    return await startupStatePromise;
  } catch (error) {
    startupStatePromise = undefined;
    throw error;
  }
};

const getActive = async () => {
  if (contentModule) {
    return contentModule.getFloatingWebNotesActive();
  }

  if (typeof activeBeforeLoad !== "boolean") {
    activeBeforeLoad = (await getStartupState()).active;
  }

  return activeBeforeLoad;
};

const setActiveFromBackground = async (active: boolean) => {
  activeBeforeLoad = active;

  if (!active && !contentModulePromise) {
    return true;
  }

  await loadContent(active);
  return true;
};

const respondToMessage = (
  operation: () => Promise<boolean>,
  sendResponse: (response: boolean) => void,
) => {
  void (async () => {
    try {
      sendResponse(await operation());
    } catch (error) {
      console.error("Failed to handle a Floating Web Notes tab message", error);
      sendResponse(false);
    }
  })();

  return true;
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "getActive") {
    return respondToMessage(getActive, sendResponse);
  }

  if (
    message.type === "setActiveFromBackground" &&
    typeof message.active === "boolean"
  ) {
    return respondToMessage(
      () => setActiveFromBackground(message.active),
      sendResponse,
    );
  }
});

const initialize = async () => {
  try {
    if (import.meta.env.MODE === "screenshot") {
      activeBeforeLoad = true;
      await loadContent(true);
      return;
    }

    const startupState = await getStartupState();
    if (typeof activeBeforeLoad !== "boolean") {
      activeBeforeLoad = startupState.active;
    }

    if (activeBeforeLoad) {
      await loadContent(activeBeforeLoad);
    }
  } catch (error) {
    console.error("Failed to initialize the Floating Web Notes loader", error);
  }
};

void initialize();
