import { type ReactNode, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useEnv } from "../utils/hooks";

export function ShadowDom({
  parentElement,
  position = "afterend",
  children,
}: {
  parentElement: Element;
  position?: InsertPosition;
  children: ReactNode;
}) {
  const { isDevEnv } = useEnv();
  const [shadowHost] = useState(() =>
    document.createElement("floating-web-notes"),
  );

  const [shadowRoot] = useState(() =>
    shadowHost.attachShadow({ mode: isDevEnv ? "open" : "closed" }),
  );

  useLayoutEffect(() => {
    if (parentElement) {
      parentElement.insertAdjacentElement(position, shadowHost);
    }

    return () => {
      shadowHost.remove();
    };
  }, [parentElement, shadowHost, position]);

  return createPortal(children, shadowRoot);
}
