import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import type { ReactNode } from "react";

type ScrollAreaProps = {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
};

export const ScrollArea = ({
  children,
  className = "",
  viewportClassName = "",
}: ScrollAreaProps) => (
  <BaseScrollArea.Root className={`ScrollAreaRoot ${className}`}>
    <BaseScrollArea.Viewport
      className={`ScrollAreaViewport ${viewportClassName}`}
    >
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
