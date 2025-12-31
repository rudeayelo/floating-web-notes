import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import type { ReactNode } from "react";

export const ScrollArea = ({ children }: { children: ReactNode }) => (
  <BaseScrollArea.Root className="ScrollAreaRoot">
    <BaseScrollArea.Viewport className="ScrollAreaViewport">
      {children}
    </BaseScrollArea.Viewport>
    <BaseScrollArea.Scrollbar
      className="ScrollAreaScrollbar"
      orientation="vertical"
    >
      <BaseScrollArea.Thumb className="ScrollAreaThumb" />
    </BaseScrollArea.Scrollbar>
    <BaseScrollArea.Corner className="ScrollAreaCorner" />
  </BaseScrollArea.Root>
);
