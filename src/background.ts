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

    cb && cb(hotkeyConflict);
  });
};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    checkHotkeyConflict();
  }
});

// Open the Floating Web Notes window when the extension icon is clicked
chrome.action.onClicked.addListener((activeTab) => {
  chrome.tabs.sendMessage(activeTab.id as number, { type: "toggleActive" });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
});
