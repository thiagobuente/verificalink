import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ShieldThemeProvider } from '@/contexts/ShieldThemeContext';

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(
    <ShieldThemeProvider>
      <TooltipProvider>{ui}</TooltipProvider>
    </ShieldThemeProvider>,
    options,
  );
}
