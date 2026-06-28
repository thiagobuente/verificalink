import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ApiHealthPanel } from './ApiHealthPanel';

describe('ApiHealthPanel', () => {
  it('renders API status, latency and uptime', () => {
    renderWithProviders(<ApiHealthPanel apis={[{ name: 'VirusTotal', status: 'online', latency: 120, uptime: 99.9, responseTime: 150, lastChecked: new Date() }]} />);
    expect(screen.getByText('VirusTotal')).toBeInTheDocument();
    expect(screen.getByText(/99.90%/)).toBeInTheDocument();
  });
});
