import { type ComponentProps, forwardRef } from "react";
import { icons } from "./icons";

type IconButtonProps = ComponentProps<"button"> & {
  icon: keyof typeof icons;
  variant?: "default" | "danger";
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, variant = "default", ...props }, ref) => (
    <button
      className={`IconButton GhostButton ${className}`}
      data-variant={variant}
      ref={ref}
      {...props}
    >
      {icons[icon]}
    </button>
  ),
);
