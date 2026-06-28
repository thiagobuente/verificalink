import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import Dashboard from './Dashboard';

vi.mock('@/components/TRPCProvider', () => ({ TRPCProvider: ({ children }: { children: React.ReactNode }) => children }));

describe('Dashboard', () => {
  it('renders enterprise navigation and overview', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getAllByText('Shield Security Scanner')[0]).toBeInTheDocument();
    expect(screen.getByText('Overview SOC')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Threat Intelligence')).toBeInTheDocument();
  });
});
