import { Fragment } from "react";

interface HotkeyProps {
  children: string;
}

export const Hotkey = ({ children }: HotkeyProps) => {
  const keys = children.split("+");

  return keys.map((key, index) => (
    <Fragment key={key}>
      <kbd>{key}</kbd>
      {index < keys.length - 1 && " + "}
    </Fragment>
  ));
};
