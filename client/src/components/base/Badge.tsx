import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeStyles = cva("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", {
  variants: { tone: { neutral: "border-slate-700 bg-slate-800/80 text-slate-300", info: "border-cyan-300/30 bg-cyan-400/10 text-cyan-200", success: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200", warning: "border-amber-300/30 bg-amber-400/10 text-amber-200", danger: "border-rose-300/30 bg-rose-400/10 text-rose-200" } },
  defaultVariants: { tone: "neutral" },
});
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeStyles> {}
export function Badge({ className, tone, ...props }: BadgeProps) { return <span className={cn(badgeStyles({ tone }), className)} {...props} />; }
