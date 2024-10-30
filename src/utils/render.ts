import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";

export function render(content: ReactElement) {
  const container = document.createDocumentFragment();
  const root = createRoot(container);
  root.render(content);
}
