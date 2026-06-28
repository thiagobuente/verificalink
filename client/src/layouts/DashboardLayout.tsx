import type * as React from "react";
import { ChevronLeft, Home, Menu, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { Button, Badge, Tooltip } from "@/components/base";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/soc/CommandPalette";
import { NotificationsCenter } from "@/components/soc/NotificationsCenter";
import { ThemeSwitcher } from "@/components/soc/ThemeSwitcher";

export interface DashboardNavItem<T extends string> {
  id: T;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps<T extends string> {
  title: string;
  subtitle: string;
  activeId: T;
  items: DashboardNavItem<T>[];
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onSelect: (id: T) => void;
  children: React.ReactNode;
}

export function DashboardLayout<T extends string>({ title, subtitle, activeId, items, collapsed, onCollapsedChange, onSelect, children }: DashboardLayoutProps<T>) {
  const [, navigate] = useLocation();
  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  return (
    <div className="min-h-screen bg-[var(--shield-bg-app)] text-slate-100">
      <div className="fixed inset-0" style={{ background: "var(--shield-bg-gradient)" }} aria-hidden="true" />
      <div className="relative flex min-h-screen">
        <aside className={cn("hidden border-r border-slate-800/90 bg-slate-950/70 backdrop-blur-xl transition-[width] duration-300 lg:flex lg:flex-col", collapsed ? "lg:w-20" : "lg:w-72")}>
          <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-4">
            <div className="flex size-10 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-200"><ShieldCheck className="size-5" /></div>
            {!collapsed && <div className="min-w-0"><p className="text-sm font-bold text-slate-50">Shield Scanner</p><p className="truncate text-xs text-slate-500">Security Operations</p></div>}
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {items.map((item) => {
              const active = item.id === activeId;
              const button = (
                <button key={item.id} onClick={() => onSelect(item.id)} className={cn("flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition", active ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-100", collapsed && "justify-center px-2")}>
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && <span className="min-w-0"><span className="block font-semibold">{item.label}</span><span className="block truncate text-xs text-slate-500">{item.description}</span></span>}
                </button>
              );
              return collapsed ? <Tooltip key={item.id} content={item.label}>{button}</Tooltip> : button;
            })}
          </nav>
          <div className="border-t border-slate-800 p-3">
            <Button variant="ghost" size={collapsed ? "icon" : "md"} className="w-full" onClick={() => onCollapsedChange(!collapsed)}>
              <ChevronLeft className={cn("transition", collapsed && "rotate-180")} />{!collapsed && "Recolher"}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/70 backdrop-blur-xl">
            <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => onCollapsedChange(!collapsed)} aria-label="Abrir navegação"><Menu /></Button>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-xl font-bold text-slate-50 sm:text-2xl">{title}</h1><Badge tone="info">Live</Badge></div><p className="mt-1 text-sm text-slate-400">{subtitle}</p></div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CommandPalette onSelectTarget={(target) => onSelect(target as T)} />
                <NotificationsCenter />
                <ThemeSwitcher />
                <Badge tone="neutral">{activeItem?.label}</Badge>
                <Button variant="secondary" onClick={() => navigate('/')}><Home />Voltar</Button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden">
              {items.map((item) => <button key={item.id} onClick={() => onSelect(item.id)} className={cn("whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold", item.id === activeId ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-slate-800 bg-slate-900/70 text-slate-400")}>{item.label}</button>)}
            </div>
          </header>
          <main className="w-full flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8"><div className="mx-auto max-w-7xl animate-[shieldFadeIn_220ms_ease-out]">{children}</div></main>
        </div>
      </div>
    </div>
  );
}
