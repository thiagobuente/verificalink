import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
export interface SpinnerProps { className?: string; label?: string; }
export function Spinner({ className, label = "Carregando" }: SpinnerProps) { return <span className={cn("inline-flex items-center gap-2 text-sm text-slate-300", className)}><Loader2 className="size-4 animate-spin text-cyan-300" aria-hidden="true" /><span>{label}</span></span>; }
