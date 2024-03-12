import { Fragment } from "react";

export const Hotkey = ({ children }: { children: string }) =>
  children.split("").map((key, idx) => (
    <Fragment key={key}>
      <kbd>{key}</kbd>
      {idx <= children.length - 2 && " + "}
    </Fragment>
  ));
