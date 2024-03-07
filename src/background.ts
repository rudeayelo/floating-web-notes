// Open the Floating Web Notes window when the extension icon is clicked
chrome.action.onClicked.addListener((activeTab) => {
  chrome.scripting.executeScript({
    target: {
      tabId: activeTab.id as number,
    },
    func: () => {
      chrome.storage.local.get("active").then(async ({ active }) => {
        await chrome.storage.local.set({ active: !active });
        return true;
      });
    },
  });
});

// chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
//   if (message.type === "toggleActive") {
//     chrome.storage.session.get("active").then(async ({ active }) => {
//       await chrome.storage.session.set({ active: !active });
//       sendResponse({ active: !active });
//     });
//     return true;
//   }

//   if (message.type === "setActive") {
//     await chrome.storage.session.set({ active: message.value });
//     sendResponse({ active: message.value });
//     return true;
//   }

//   if (message.type === "getActive") {
//     chrome.storage.session.get("active").then(({ active }) => {
//       sendResponse({ active });
//     });
//     return true;
//   }
// });
