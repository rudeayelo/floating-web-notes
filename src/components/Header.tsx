import * as Tooltip from "@radix-ui/react-tooltip";
import { useSettingsStore, useUIStore } from "../store";
import { IconButton } from "./IconButton";
import { SettingsDropdown } from "./SettingsDropdown";

export const Header = () => {
  const setActive = useSettingsStore((state) => state.setActive);
  const restorePosition = useUIStore((state) => state.restorePosition);
  const hasCustomPosition = useUIStore((state) => state.hasCustomPosition);

  return (
    <div className="Header">
      <div className="HeaderStart">
        <IconButton
          icon="close"
          onClick={() => setActive(false)}
          id="CloseButton"
        />
      </div>

      <div className="HeaderHandle"></div>

      <div className="HeaderEnd">
        {hasCustomPosition && (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <IconButton
                icon="pin"
                onClick={() => restorePosition(window.location.href)}
                id="PinButton"
              />
            </Tooltip.Trigger>
            <Tooltip.Content className="TooltipContent" sideOffset={4}>
              Unpin window
              <Tooltip.Arrow className="TooltipArrow" />
            </Tooltip.Content>
          </Tooltip.Root>
        )}

        <SettingsDropdown />
      </div>
    </div>
  );
};
