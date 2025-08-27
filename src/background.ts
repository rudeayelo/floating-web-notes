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

  if (
    details.reason === chrome.runtime.OnInstalledReason.UPDATE &&
    details.previousVersion
  ) {
    chrome.storage.local.set({ previousVersion: details.previousVersion });
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
          if (!sender.tab?.id) return;
          const next = visibility
            ? { ...visibility, [sender.tab.id]: message.value }
            : { [sender.tab.id]: message.value };
          chrome.storage.session
            .set({ visibility: next })
            .then(() => sendResponse(true));
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
      .then(
        ({ firstTimeNoticeAck }: { [key: string]: boolean | undefined }) => {
          sendResponse(firstTimeNoticeAck || false);
        },
      );
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
    chrome.storage.local.get("urlState").then(({ urlState }) => {
      const position = urlState?.[message.url]?.position;
      sendResponse(position);
    });

    return true;
  }

  if (message.type === "setPosition") {
    chrome.storage.local.get("urlState").then(({ urlState }) => {
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
    chrome.storage.local.get("urlState").then(({ urlState }) => {
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
