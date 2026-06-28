import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { Button, Card } from "@/components/base";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, icon: Icon = Search, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="flex min-h-48 items-center justify-center border-dashed p-8 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-cyan-200"><Icon className="size-5" /></div>
        <h3 className="mt-4 text-base font-semibold text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
        {actionLabel && onAction ? <Button className="mt-4" variant="secondary" onClick={onAction}>{actionLabel}</Button> : null}
      </div>
    </Card>
  );
}
