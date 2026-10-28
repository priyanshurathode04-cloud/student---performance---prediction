import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111f] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#58a6ff] text-[#07111f] hover:bg-[#82bcff]",
        secondary: "border border-[#29415c] bg-[#102238] text-[#dce9f8] hover:bg-[#17304a]",
        ghost: "text-[#9db0c8] hover:bg-white/[0.06] hover:text-[#edf4ff]",
        outline: "border border-[#29415c] bg-transparent text-[#dce9f8] hover:bg-white/[0.04]",
        success: "bg-[#46e0a0] text-[#071a18] hover:bg-[#71edb8]",
      },
      size: {
        default: "min-h-10 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-11 rounded-xl px-5",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  ),
);
Button.displayName = "Button";
