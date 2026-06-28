import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";
export interface StatCardProps { label: string; value: string; detail?: string; icon: LucideIcon; tone?: "info" | "success" | "warning" | "danger" | "neutral"; }
const toneClass = { info: "text-cyan-200 bg-cyan-400/10 border-cyan-300/20", success: "text-emerald-200 bg-emerald-400/10 border-emerald-300/20", warning: "text-amber-200 bg-amber-400/10 border-amber-300/20", danger: "text-rose-200 bg-rose-400/10 border-rose-300/20", neutral: "text-slate-200 bg-slate-800 border-slate-700" };
export function StatCard({ label, value, detail, icon: Icon, tone = "info" }: StatCardProps) { return <Card interactive className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-50">{value}</p>{detail ? <p className="mt-1 text-sm text-slate-400">{detail}</p> : null}</div><div className={cn("rounded-lg border p-2", toneClass[tone])}><Icon className="size-5" aria-hidden="true" /></div></div></Card>; }
