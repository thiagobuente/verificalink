import * as React from "react";
import { cn } from "@/lib/utils";
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; hint?: string; }
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, label, hint, id, ...props }, ref) => {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  return <label className="block space-y-2" htmlFor={inputId}>{label ? <span className="text-sm font-medium text-slate-200">{label}</span> : null}<input id={inputId} ref={ref} className={cn("h-11 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20", className)} {...props} />{hint ? <span className="text-xs text-slate-500">{hint}</span> : null}</label>;
});
Input.displayName = "Input";
