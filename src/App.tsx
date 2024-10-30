import { useEffect, useState } from "react";
import { Help } from "./components/Help";
import { Notes } from "./components/Notes";
import styles from "./styles.css?inline";
import { useActive, useActiveView, useScreenshotMode } from "./utils/hooks";
import { render } from "./utils/render";

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
          {activeView === "help" ? <Help /> : <Notes />}
        </div>
      </div>
    </>
  ) : null;
};

render(<App />);
