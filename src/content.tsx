import "./font-face.css";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useState } from "react";
import { App } from "./App";
import { ShadowDom } from "./components/ShadowDom";
import { render } from "./utils/render";

export const FloatingWebNotes = () => {
  const [parentElement] = useState(() => document.querySelector("body"));

  return parentElement ? (
    <Tooltip.Provider delayDuration={0} disableHoverableContent={true}>
      <ShadowDom parentElement={parentElement}>
        <App />
      </ShadowDom>
    </Tooltip.Provider>
  ) : null;
};

render(<FloatingWebNotes />);
