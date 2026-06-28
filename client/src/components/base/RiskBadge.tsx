import type * as React from "react";
import { Badge } from "./Badge";
export interface RiskBadgeProps { level: "safe" | "warning" | "danger" | "neutral"; children?: React.ReactNode; }
const riskTone = { safe: "success", warning: "warning", danger: "danger", neutral: "neutral" } as const;
const riskLabel = { safe: "Seguro", warning: "Atenção", danger: "Crítico", neutral: "Neutro" };
export function RiskBadge({ level, children }: RiskBadgeProps) { return <Badge tone={riskTone[level]}>{children ?? riskLabel[level]}</Badge>; }
