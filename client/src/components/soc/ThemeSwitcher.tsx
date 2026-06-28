import { Moon, Palette } from "lucide-react";
import { Button } from "@/components/base";
import { useShieldTheme, type ShieldThemeMode } from "@/contexts/ShieldThemeContext";
import { cn } from "@/lib/utils";

const modes: Array<{ id: ShieldThemeMode; label: string }> = [
  { id: "dark", label: "Dark" },
  { id: "midnight", label: "Midnight" },
  { id: "cyber", label: "Cyber" },
  { id: "blue", label: "Blue" },
];

export function ThemeSwitcher() {
  const { mode, setMode } = useShieldTheme();
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/70 p-1">
      <span className="hidden px-2 text-slate-500 sm:inline-flex"><Palette className="size-4" /></span>
      {modes.map((item) => (
        <Button key={item.id} type="button" size="sm" variant="ghost" onClick={() => setMode(item.id)} className={cn("min-h-8 px-2 text-xs", mode === item.id && "bg-cyan-300/10 text-cyan-100")}>
          {item.id === "dark" ? <Moon className="size-3" /> : null}{item.label}
        </Button>
      ))}
    </div>
  );
}
