import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ShieldThemeProvider, useShieldTheme } from './ShieldThemeContext';

function ThemeProbe() {
  const { mode, setMode } = useShieldTheme();
  return <button onClick={() => setMode('cyber')}>mode:{mode}</button>;
}

describe('ShieldThemeProvider', () => {
  it('persists selected theme on the document root', async () => {
    render(<ShieldThemeProvider><ThemeProbe /></ShieldThemeProvider>);
    await userEvent.click(screen.getByRole('button'));
    expect(document.documentElement.dataset.shieldTheme).toBe('cyber');
  });
});
