import { useNotesStore, useSettingsStore, useUIStore } from "../store";

// Flag to ensure subscriptions are only set up once
let subscriptionsSetup = false;
// Store unsubscribe functions for cleanup
let unsubscribeFunctions: (() => void)[] = [];

/**
 * Deep comparison utility for arrays and objects
 */
const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === "object" && typeof b === "object") {
    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(objA[key], objB[key]))
        return false;
    }
    return true;
  }
  return false;
};

/**
 * Alternative debug utility that uses Zustand's subscription capabilities
 * This approach is more performant and doesn't require React hooks
 */
export const setupDebugSubscriptions = () => {
  if (!import.meta.env.DEV) return;

  // Prevent multiple subscriptions
  if (subscriptionsSetup) {
    console.log("🔧 Debug subscriptions already set up, skipping...");
    return;
  }

  console.log("🔧 Setting up debug subscriptions...");
  subscriptionsSetup = true;

  let prevSettings = useSettingsStore.getState();
  let prevUI = useUIStore.getState();
  let prevNotes = useNotesStore.getState();

  // Subscribe to settings store changes
  const unsubSettings = useSettingsStore.subscribe((state) => {
    const changed = {
      active: state.active !== prevSettings.active,
      hotkey: state.hotkey !== prevSettings.hotkey,
      theme: state.theme !== prevSettings.theme,
      defaultOpen: state.defaultOpen !== prevSettings.defaultOpen,
    };

    if (Object.values(changed).some(Boolean)) {
      console.log("⚙️ Settings Store changed:", {
        changes: changed,
        current: {
          active: state.active,
          hotkey: state.hotkey,
          theme: state.theme,
          defaultOpen: state.defaultOpen,
        },
      });
      prevSettings = state;
    }
  });

  // Subscribe to UI store changes
  const unsubUI = useUIStore.subscribe((state) => {
    const changed = {
      activeView: state.activeView !== prevUI.activeView,
      screenshotMode: state.screenshotMode !== prevUI.screenshotMode,
      firstTimeNoticeAck:
        state.firstTimeNoticeAck !== prevUI.firstTimeNoticeAck,
    };

    if (Object.values(changed).some(Boolean)) {
      console.log("🎨 UI Store changed:", {
        changes: changed,
        current: {
          activeView: state.activeView,
          screenshotMode: state.screenshotMode,
          firstTimeNoticeAck: state.firstTimeNoticeAck,
        },
      });
      prevUI = state;
    }
  });

  // Subscribe to notes store changes
  const unsubNotes = useNotesStore.subscribe((state) => {
    const changed = {
      notes: !deepEqual(state.notes, prevNotes.notes),
      notesById: !deepEqual(state.notesById, prevNotes.notesById),
    };

    if (Object.values(changed).some(Boolean)) {
      console.log("📝 Notes Store changed:", {
        changes: changed,
        current: {
          notesCount: state.notes.length,
          notesByIdCount: state.notesById.length,
          notes: state.notes,
          notesById: state.notesById,
        },
      });

      // Also log chrome storage when notes change
      chrome.storage.local
        .get()
        .then((storage) => console.log("📦 Chrome Storage:", storage));

      prevNotes = state;
    }
  });

  // Store unsubscribe functions for potential cleanup
  unsubscribeFunctions.push(unsubSettings, unsubUI, unsubNotes);
};

/**
 * Cleanup function to remove all debug subscriptions
 * Useful for testing or if you need to reset subscriptions
 */
export const cleanupDebugSubscriptions = () => {
  if (!import.meta.env.DEV) return;

  console.log("🧹 Cleaning up debug subscriptions...");
  unsubscribeFunctions.forEach((unsub) => unsub());
  unsubscribeFunctions = [];
  subscriptionsSetup = false;
};
