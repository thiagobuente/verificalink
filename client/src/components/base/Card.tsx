import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> { interactive?: boolean; }

export function Card({ className, interactive = false, ...props }: CardProps) {
  return <div className={cn("rounded-lg border border-slate-700/70 bg-slate-900/70 shadow-[0_18px_50px_rgba(0,0,0,0.26)] backdrop-blur", interactive && "transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-slate-900", className)} {...props} />;
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("border-b border-slate-800 px-5 py-4", className)} {...props} />; }
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("px-5 py-5", className)} {...props} />; }
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) { return <h3 className={cn("text-base font-semibold text-slate-100", className)} {...props} />; }
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) { return <p className={cn("mt-1 text-sm text-slate-400", className)} {...props} />; }
