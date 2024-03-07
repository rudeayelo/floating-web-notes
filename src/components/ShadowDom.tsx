import React from "react";
import ReactDOM from "react-dom";

export function ShadowDom({
  parentElement,
  position = "afterend",
  children,
}: {
  parentElement: Element;
  position?: InsertPosition;
  children: React.ReactNode;
}) {
  const [shadowHost] = React.useState(() =>
    document.createElement("floating-web-notes"),
  );

  const [shadowRoot] = React.useState(() =>
    shadowHost.attachShadow({ mode: "closed" }),
  );

  React.useLayoutEffect(() => {
    if (parentElement) {
      parentElement.insertAdjacentElement(position, shadowHost);
    }

    return () => {
      shadowHost.remove();
    };
  }, [parentElement, shadowHost, position]);

  return ReactDOM.createPortal(children, shadowRoot);
}
