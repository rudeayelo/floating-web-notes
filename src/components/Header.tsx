import { useActive } from "../utils/hooks";
import { IconButton } from "./IconButton";
import { SettingsDropdown } from "./SettingsDropdown";

export const Header = () => {
  const { setActive } = useActive();

  return (
    <div className="Header">
      <IconButton icon="close" onClick={() => setActive(false)} />
      <SettingsDropdown />
    </div>
  );
};
