import { useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { Help } from "./components/Help";
import { Notes } from "./components/Notes";
import { useNotesStore, useSettingsStore, useUIStore } from "./store";
import styles from "./styles.css?inline";
import { setupDebugSubscriptions } from "./utils/debugSubscriptions";

export const App = () => {
  const active = useUIStore((state) => state.active);
  const activeView = useUIStore((state) => state.activeView);
  const initializeUIStore = useUIStore((state) => state.initialize);
  const initializeSettingsStore = useSettingsStore((state) => state.initialize);
  const notesById = useNotesStore((state) => state.notesById);
  const updateNotes = useNotesStore((state) => state.updateNotes);
  const position = useUIStore((state) => state.position);
  const hasCustomPosition = useUIStore((state) => state.hasCustomPosition);
  const setPosition = useUIStore((state) => state.setPosition);
  const setRootRef = useUIStore((state) => state.setRootRef);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Setup debug subscriptions once
    setupDebugSubscriptions();
  }, []);

  useEffect(() => {
    initializeUIStore();
    initializeSettingsStore();
    setRootRef(rootRef);
  }, [initializeUIStore, initializeSettingsStore, setRootRef]);

  // Update notes when active state or notesById changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: dependencies are needed for notes sync
  useEffect(() => {
    updateNotes();
  }, [active, notesById, updateNotes]);

  return active ? (
    <>
      <style type="text/css">{styles}</style>

      <div id="root" ref={rootRef}>
        <Rnd
          default={{
            ...position,
            width: "auto",
            height: "auto",
          }}
          position={position}
          dragHandleClassName="HeaderHandle"
          bounds="body"
          enableResizing={false}
          onDragStop={(_e, d) => {
            setPosition({ x: d.x, y: d.y });
          }}
          className="Container"
          {...(!hasCustomPosition && { "data-custom-position": false })}
        >
          {activeView === "help" ? <Help /> : <Notes />}
        </Rnd>
      </div>
    </>
  ) : null;
};
