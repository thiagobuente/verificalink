import type * as React from "react";
import { Tooltip as TooltipRoot, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
export interface TooltipProps { content: React.ReactNode; children: React.ReactNode; }
export function Tooltip({ content, children }: TooltipProps) { return <TooltipRoot><TooltipTrigger asChild>{children}</TooltipTrigger><TooltipContent className="border border-slate-700 bg-slate-950 text-slate-100">{content}</TooltipContent></TooltipRoot>; }
