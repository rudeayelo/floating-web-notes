import { useEffect } from "react";
import { Rnd } from "react-rnd";
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
  const position = useUIStore((state) => state.position);
  const hasCustomPosition = useUIStore((state) => state.hasCustomPosition);
  const setPosition = useUIStore((state) => state.setPosition);

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
        <Rnd
          className="Container"
          default={{
            ...position,
            width: "auto",
            height: "auto",
          }}
          position={position}
          dragHandleClassName="Header"
          bounds="body"
          enableResizing={false}
          onDragStop={(_e, d) => {
            setPosition(window.location.href, { x: d.x, y: d.y });
          }}
          {...(!hasCustomPosition && { "data-custom-position": false })}
        >
          {activeView === "help" ? <Help /> : <Notes />}
        </Rnd>
      </div>
    </>
  ) : null;
};

render(<App />);
