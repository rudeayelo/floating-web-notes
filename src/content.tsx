import "./font-face.css";
import { useState } from "react";
import { render } from "./utils/render";
import { AppProvider } from "./components/AppContext";
import { ShadowDom } from "./components/ShadowDom";
import { App } from "./App";

export const FloatingWebNotes = () => {
  const [parentElement] = useState(() => document.querySelector("body"));

  return parentElement ? (
    <AppProvider>
      <ShadowDom parentElement={parentElement}>
        <App />
      </ShadowDom>
    </AppProvider>
  ) : null;
};

render(<FloatingWebNotes />);
