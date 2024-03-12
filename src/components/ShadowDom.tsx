import { type ReactNode, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

export function ShadowDom({
  parentElement,
  position = "afterend",
  children,
}: {
  parentElement: Element;
  position?: InsertPosition;
  children: ReactNode;
}) {
  const [shadowHost] = useState(() =>
    document.createElement("floating-web-notes"),
  );

  const [shadowRoot] = useState(() =>
    shadowHost.attachShadow({ mode: "closed" }),
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
