import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CommandPalette } from './CommandPalette';

describe('CommandPalette', () => {
  it('filters and selects targets', async () => {
    const onSelectTarget = vi.fn();
    renderWithProviders(<CommandPalette open onOpenChange={() => undefined} onSelectTarget={onSelectTarget} />);

    await userEvent.type(screen.getByPlaceholderText(/Pesquisar IOC/i), 'MITRE');
    await userEvent.click(screen.getByText('MITRE ATT&CK Explorer'));

    expect(onSelectTarget).toHaveBeenCalledWith('mitre');
  });
});
