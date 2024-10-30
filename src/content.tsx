import "./font-face.css";
import { useState } from "react";
import { App } from "./App";
import { AppProvider } from "./components/AppContext";
import { ShadowDom } from "./components/ShadowDom";
import { render } from "./utils/render";

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
