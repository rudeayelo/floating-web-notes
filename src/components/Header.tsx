import { useActive } from "./AppContext";
import { IconButton } from "./IconButton";
import { SettingsDropdown } from "./SettingsDropdown";

export const Header = () => {
  const { setActive } = useActive();

  return (
    <div className="Header">
      <IconButton icon="close" onClick={setActive} />
      <SettingsDropdown />
    </div>
  );
};
