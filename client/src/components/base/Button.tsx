import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold outline-none transition-[background,border,box-shadow,color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-cyan-300/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "border border-cyan-300/30 bg-cyan-400 text-slate-950 shadow-[0_14px_34px_rgba(34,211,238,0.18)] hover:bg-cyan-300",
        secondary: "border border-slate-700 bg-slate-900/80 text-slate-100 hover:border-slate-500 hover:bg-slate-800",
        ghost: "border border-transparent bg-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white",
        danger: "border border-rose-300/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/20",
      },
      size: { sm: "min-h-8 px-3 text-xs", md: "min-h-10 px-4 text-sm", lg: "min-h-12 px-5 text-base", icon: "size-10 p-0" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> { loading?: boolean; }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, children, disabled, loading, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonStyles({ variant, size }), className)} disabled={disabled || loading} {...props}>
    {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
    {children}
  </button>
));

Button.displayName = "Button";
