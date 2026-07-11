import "./font-face.css";
import { Tooltip } from "@base-ui/react/tooltip";
import { useState } from "react";
import { App } from "./App";
import { ShadowDom } from "./components/ShadowDom";
import { render } from "./utils/render";

export const FloatingWebNotes = () => {
  const [parentElement] = useState(() => document.querySelector("body"));

  return parentElement ? (
    <Tooltip.Provider closeDelay={0} timeout={0}>
      <ShadowDom parentElement={parentElement}>
        <App />
      </ShadowDom>
    </Tooltip.Provider>
  ) : null;
};

render(<FloatingWebNotes />);
