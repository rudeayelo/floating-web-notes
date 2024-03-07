import { forwardRef, type ComponentProps } from "react";
import { icons } from "./icons";

type IconButtonProps = ComponentProps<"button"> & {
  icon: keyof typeof icons;
  variant?: "default" | "danger";
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = "default", ...props }, ref) => (
    <button
      className="IconButton GhostButton"
      data-variant={variant}
      ref={ref}
      {...props}
    >
      {icons[icon]}
    </button>
  ),
);
