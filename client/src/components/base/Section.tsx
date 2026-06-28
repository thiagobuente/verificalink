import * as React from "react";
import { cn } from "@/lib/utils";
export interface SectionProps extends React.HTMLAttributes<HTMLElement> { title?: string; description?: string; action?: React.ReactNode; }
export function Section({ title, description, action, className, children, ...props }: SectionProps) { return <section className={cn("space-y-4", className)} {...props}>{(title || description || action) && <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div>{title ? <h2 className="text-lg font-semibold text-slate-100">{title}</h2> : null}{description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}</div>{action ? <div className="shrink-0">{action}</div> : null}</div>}{children}</section>; }
