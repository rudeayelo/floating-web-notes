import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { Help } from "./components/Help";
import { Notes } from "./components/Notes";
import { UtilityFrame } from "./components/UtilityFrame";
import fontFaceStyles from "./font-face.css?inline";
import { useNotesStore, useSettingsStore, useUIStore } from "./store";
import styles from "./styles.css?inline";
import type { Position } from "./types";
import { setupDebugSubscriptions } from "./utils/debugSubscriptions";
import type { ResolvedTheme } from "./utils/theme";
import { getResolvedTheme, watchSystemTheme } from "./utils/theme";

type AppProps = {
  getActiveOverride?: () => boolean | undefined;
};

export const App = ({ getActiveOverride }: AppProps) => {
  const initialized = useUIStore((state) => state.initialized);
  const active = useUIStore((state) => state.active);
  const activeView = useUIStore((state) => state.activeView);
  const activeUtilityPanel = useUIStore((state) => state.activeUtilityPanel);
  const initializeUIStore = useUIStore((state) => state.initialize);
  const initializeSettingsStore = useSettingsStore((state) => state.initialize);
  const theme = useSettingsStore((state) => state.theme);
  const updateNotes = useNotesStore((state) => state.updateNotes);
  const position = useUIStore((state) => state.position);
  const positionContextKey = useUIStore((state) => state.positionContextKey);
  const hasCustomPosition = useUIStore((state) => state.hasCustomPosition);
  const setPosition = useUIStore((state) => state.setPosition);
  const setRootRef = useUIStore((state) => state.setRootRef);
  const rootRef = useRef<HTMLDivElement>(null);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    getResolvedTheme(theme),
  );

  const persistPosition = async (nextPosition: Position) => {
    try {
      await setPosition(nextPosition);
    } catch (error) {
      console.error("Failed to save the panel position", error);
    }
  };

  useEffect(() => {
    // Setup debug subscriptions once
    setupDebugSubscriptions();
  }, []);

  useEffect(() => {
    setRootRef(rootRef);

    const initialize = async () => {
      try {
        await Promise.all([
          initializeUIStore(getActiveOverride),
          initializeSettingsStore(),
        ]);
      } catch (error) {
        console.error("Failed to initialize Floating Web Notes", error);
      }
    };

    void initialize();
  }, [
    getActiveOverride,
    initializeUIStore,
    initializeSettingsStore,
    setRootRef,
  ]);

  useEffect(() => {
    if (theme !== "system") {
      setResolvedTheme(theme);
      return;
    }

    return watchSystemTheme(setResolvedTheme);
  }, [theme]);

  // Update notes on load and when active state changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: dependencies are needed for notes sync
  useEffect(() => {
    updateNotes();
  }, [active, updateNotes]);

  return active && initialized ? (
    <>
      <style type="text/css">
        {fontFaceStyles}
        {styles}
      </style>

      <div
        id="root"
        ref={rootRef}
        data-theme={resolvedTheme}
        data-theme-setting={theme}
        {...(!hasCustomPosition && { "data-custom-position": false })}
      >
        <Rnd
          key={positionContextKey}
          default={{
            x: 0,
            y: 0,
            width: "auto",
            height: "auto",
          }}
          position={position}
          dragHandleClassName="HeaderHandle"
          enableResizing={false}
          onDragStop={(_e, d) => {
            const nextPosition = hasCustomPosition
              ? { x: d.x, y: d.y }
              : { x: d.x + window.scrollX, y: d.y + window.scrollY };
            void persistPosition(nextPosition);
          }}
          className="FloatingWindows"
          data-utility-active={activeUtilityPanel !== null}
        >
          <div className="Container">
            {activeView === "help" ? <Help /> : <Notes />}
          </div>
          <UtilityFrame />
        </Rnd>
      </div>
    </>
  ) : null;
};
