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

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    checkHotkeyConflict();
  }
});

// Open the Floating Web Notes window when the extension icon is clicked
chrome.action.onClicked.addListener((activeTab) => {
  chrome.storage.session
    .get("visibility")
    .then(
      ({
        visibility,
      }: {
        [key: string]: { [key: number]: "visible" | "hidden" } | undefined;
      }) => {
        if (visibility && activeTab.id && visibility[activeTab.id]) {
          chrome.storage.session.set({
            visibility: {
              ...visibility,
              [activeTab.id]:
                visibility[activeTab.id] === "visible" ? "hidden" : "visible",
            },
          });
        }
        chrome.tabs.sendMessage(activeTab.id as number, {
          type: "toggleActive",
        });
      },
    );
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
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    return true;
  }

  if (message.type === "reloadExtension") {
    chrome.runtime.reload();
    return true;
  }

  if (message.type === "getVisibility") {
    chrome.storage.session
      .get("visibility")
      .then(
        ({
          visibility,
        }: {
          [key: string]: { [key: number]: "visible" | "hidden" } | undefined;
        }) => {
          sendResponse(
            visibility && sender.tab?.id && visibility[sender.tab?.id],
          );
        },
      );
    return true;
  }

  if (message.type === "setVisibility") {
    chrome.storage.session
      .get("visibility")
      .then(
        ({
          visibility,
        }: {
          [key: string]: { [key: number]: "visible" | "hidden" } | undefined;
        }) => {
          if (!visibility && sender.tab?.id) {
            chrome.storage.session.set({
              visibility: { [sender.tab?.id]: message.value },
            });
          }
          if (visibility && sender.tab?.id) {
            chrome.storage.session.set({
              visibility: { ...visibility, [sender.tab?.id]: message.value },
            });
          }
        },
      );
    return true;
  }

  if (message.type === "getOpenDefault") {
    chrome.storage.local.get("open").then(({ open }) => {
      sendResponse(open);
    });
    return true;
  }

  if (message.type === "setOpenDefault") {
    chrome.storage.local.set({ open: message.value });
    return true;
  }

  if (message.type === "getTheme") {
    chrome.storage.local.get("theme").then(({ theme }) => {
      sendResponse(theme);
    });
    return true;
  }

  if (message.type === "setTheme") {
    chrome.storage.local.set({ theme: message.theme });
    return true;
  }

  if (message.type === "getFirstTimeNoticeAck") {
    chrome.storage.local
      .get("firstTimeNoticeAck")
      .then(
        ({ firstTimeNoticeAck }: { [key: string]: boolean | undefined }) => {
          sendResponse(firstTimeNoticeAck || false);
        },
      );
    return true;
  }

  if (message.type === "setFirstTimeNoticeAck") {
    chrome.storage.local.set({ firstTimeNoticeAck: message.value });
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

  if (message.type === "setNotesById") {
    chrome.storage.local.set({ notesById: message.notesById });
    return true;
  }

  if (message.type === "setNote") {
    chrome.storage.local.set({
      [message.id]: {
        id: message.id,
        pattern: message.pattern,
        text: message.text,
      },
    });
    return true;
  }

  if (message.type === "removeNote") {
    chrome.storage.local.remove(message.id);
    return true;
  }

  if (message.type === "getPosition") {
    chrome.storage.local.get("urlState").then(({ urlState }) => {
      const position = urlState?.[message.url]?.position;
      sendResponse(position);
    });

    return true;
  }

  if (message.type === "setPosition") {
    chrome.storage.local.get("urlState").then(({ urlState }) => {
      chrome.storage.local.set({
        urlState: {
          ...urlState,
          [message.url]: { position: message.position },
        },
      });
    });

    return true;
  }

  if (message.type === "removePosition") {
    chrome.storage.local.get("urlState").then(({ urlState }) => {
      const newUrlState = { ...urlState };
      delete newUrlState[message.url];
      chrome.storage.local.set({
        urlState: newUrlState,
      });
    });

    return true;
  }
});
