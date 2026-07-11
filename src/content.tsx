import { Tooltip } from "@base-ui/react/tooltip";
import { useState } from "react";
import { App } from "./App";
import { ShadowDom } from "./components/ShadowDom";
import { useUIStore } from "./store";
import { render } from "./utils/render";

let mounted = false;
let requestedActive: boolean | undefined;

const getRequestedActive = () => requestedActive;

export const getFloatingWebNotesActive = () => useUIStore.getState().active;

export const setFloatingWebNotesActive = (active: boolean) => {
  requestedActive = active;
  if (mounted) {
    useUIStore.setState({ active });
  }
};

export const FloatingWebNotes = () => {
  const [parentElement] = useState(() => document.querySelector("body"));

  return parentElement ? (
    <Tooltip.Provider closeDelay={0} timeout={0}>
      <ShadowDom parentElement={parentElement}>
        <App getActiveOverride={getRequestedActive} />
      </ShadowDom>
    </Tooltip.Provider>
  ) : null;
};

export const mountFloatingWebNotes = (initialActive: boolean) => {
  setFloatingWebNotesActive(initialActive);
  if (mounted) return;

  mounted = true;
  render(<FloatingWebNotes />);
};
