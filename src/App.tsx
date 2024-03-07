import { useEffect, useState } from "react";
import { render } from "./utils/render";
import { Notes } from "./components/Notes";
import {
  useActive,
  useActiveView,
  useScreenshotMode,
} from "./components/AppContext";
import { HotkeyRecorder } from "./components/HotkeyRecorder";
import styles from "./styles.css?inline";
import { Help } from "./components/Help";

export const App = () => {
  const { active } = useActive();
  const { activeView } = useActiveView();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { screenshotMode } = useScreenshotMode();

  useEffect(() => {
    if (active) {
      setIsTransitioning(true);
      return;
    }
    setIsTransitioning(false);
  }, [active]);

  return active ? (
    <>
      <style type="text/css">{styles}</style>

      <div id="root" {...(screenshotMode && { "data-screenshot-mode": true })}>
        <div className="Container" data-transition-state={isTransitioning}>
          {activeView === "recordHotkey" ? (
            <HotkeyRecorder />
          ) : activeView === "help" ? (
            <Help />
          ) : (
            <Notes />
          )}
        </div>
      </div>
    </>
  ) : null;
};

render(<App />);
