import { useSettingsStore } from "../store";
import { IconButton } from "./IconButton";
import { SettingsDropdown } from "./SettingsDropdown";

export const Header = () => {
  const setActive = useSettingsStore((state) => state.setActive);

  return (
    <div className="Header">
      <IconButton
        icon="close"
        onClick={() => setActive(false)}
        id="CloseButton"
      />
      <SettingsDropdown />
    </div>
  );
};
