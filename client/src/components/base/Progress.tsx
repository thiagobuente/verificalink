import { cn } from "@/lib/utils";
export interface ProgressProps { value: number; className?: string; tone?: "info" | "success" | "warning" | "danger"; }
const toneClass = { info: "bg-cyan-300", success: "bg-emerald-300", warning: "bg-amber-300", danger: "bg-rose-300" };
export function Progress({ value, className, tone = "info" }: ProgressProps) { const safeValue = Math.max(0, Math.min(100, value)); return <div className={cn("h-2 overflow-hidden rounded-full bg-slate-800", className)} role="progressbar" aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={100}><div className={cn("h-full rounded-full transition-all duration-500", toneClass[tone])} style={{ width: String(safeValue) + "%" }} /></div>; }
