import { useEffect } from "react";
import { Help } from "./components/Help";
import { Notes } from "./components/Notes";
import { useNotesStore, useSettingsStore, useUIStore } from "./store";
import styles from "./styles.css?inline";
import { setupDebugSubscriptions } from "./utils/debugSubscriptions";
import { render } from "./utils/render";

export const App = () => {
  const active = useSettingsStore((state) => state.active);
  const activeView = useUIStore((state) => state.activeView);
  const screenshotMode = useUIStore((state) => state.screenshotMode);
  const initializeUIStore = useUIStore((state) => state.initialize);
  const initializeSettingsStore = useSettingsStore((state) => state.initialize);
  const notesById = useNotesStore((state) => state.notesById);
  const updateNotes = useNotesStore((state) => state.updateNotes);

  useEffect(() => {
    // Setup debug subscriptions once
    setupDebugSubscriptions();
  }, []);

  useEffect(() => {
    initializeUIStore();
    initializeSettingsStore();
  }, [initializeUIStore, initializeSettingsStore]);

  // Update notes when active state or notesById changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: dependencies are needed for notes sync
  useEffect(() => {
    updateNotes();
  }, [active, notesById, updateNotes]);

  return active ? (
    <>
      <style type="text/css">{styles}</style>

      <div id="root" {...(screenshotMode && { "data-screenshot-mode": true })}>
        <div className="Container">
          {activeView === "help" ? <Help /> : <Notes />}
        </div>
      </div>
    </>
  ) : null;
};

render(<App />);
