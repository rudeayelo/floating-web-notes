import { Tooltip } from "@base-ui-components/react/tooltip";
import { useUIStore } from "../store";
import { IconButton } from "./IconButton";
import { icons } from "./icons";
import { SettingsDropdown } from "./SettingsDropdown";

export const Header = () => {
  const setActive = useUIStore((state) => state.setActive);
  const restorePosition = useUIStore((state) => state.restorePosition);
  const hasCustomPosition = useUIStore((state) => state.hasCustomPosition);
  const dragHandleDiscovered = useUIStore(
    (state) => state.dragHandleDiscovered,
  );
  const markDragHandleDiscovered = useUIStore(
    (state) => state.markDragHandleDiscovered,
  );
  const rootRef = useUIStore((state) => state.rootRef);

  return (
    <div className="Header">
      <div className="HeaderStart">
        <IconButton
          icon="close"
          onClick={() => setActive(false)}
          id="CloseButton"
        />
      </div>

      <Tooltip.Root
        onOpenChange={(open) => {
          if (open && !dragHandleDiscovered) {
            // Mark as discovered the first time the tooltip opens
            void markDragHandleDiscovered();
          }
        }}
      >
        <Tooltip.Trigger
          delay={dragHandleDiscovered ? 3000 : 1000}
          render={<div className="HeaderHandle" />}
        />
        <Tooltip.Portal container={rootRef}>
          <Tooltip.Positioner sideOffset={4}>
            <Tooltip.Popup className="TooltipContent">
              Drag the panel to fix its position somewhere on the current page
              <Tooltip.Arrow className="TooltipArrow">
                {icons.popArrow}
              </Tooltip.Arrow>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>

      <div className="HeaderEnd">
        {hasCustomPosition && (
          <Tooltip.Root>
            <Tooltip.Trigger
              delay={0}
              render={
                <IconButton
                  icon="pin"
                  onClick={() => restorePosition(window.location.href)}
                  id="RestorePositionButton"
                />
              }
            />
            <Tooltip.Portal container={rootRef}>
              <Tooltip.Positioner sideOffset={4}>
                <Tooltip.Popup className="TooltipContent">
                  Restore position
                  <Tooltip.Arrow className="TooltipArrow">
                    {icons.popArrow}
                  </Tooltip.Arrow>
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}

        <SettingsDropdown />
      </div>
    </div>
  );
};
