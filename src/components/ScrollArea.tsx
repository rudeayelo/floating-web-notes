import { type ReactNode } from "react";
import * as RadixScrollArea from "@radix-ui/react-scroll-area";

export const ScrollArea = ({ children }: { children: ReactNode }) => (
  <RadixScrollArea.Root className="ScrollAreaRoot">
    <RadixScrollArea.Viewport className="ScrollAreaViewport">
      {children}
    </RadixScrollArea.Viewport>
    <RadixScrollArea.Scrollbar
      className="ScrollAreaScrollbar"
      orientation="vertical"
    >
      <RadixScrollArea.Thumb className="ScrollAreaThumb" />
    </RadixScrollArea.Scrollbar>
    <RadixScrollArea.Corner className="ScrollAreaCorner" />
  </RadixScrollArea.Root>
);
