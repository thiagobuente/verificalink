# Shield Security Scanner

Shield Security Scanner is a React + TypeScript threat intelligence and SOC-style security scanner for links, messages, emails, PDFs, files, QR Codes and IOCs.

## Architecture

The application is organized as a modular frontend with a small Node/Express production server.

- client/src/pages: route-level screens.
- client/src/components/base: reusable design-system primitives.
- client/src/components/soc: SOC platform components such as command palette, API health and data tables.
- client/src/components/enterprise: enterprise threat-intelligence modules.
- client/src/domain: pure domain logic for IOC correlation, MITRE data and exports.
- client/src/plugins: independent plugin architecture for future integrations.
- server/observability: structured logging, metrics and request/error middleware.
- .github/workflows: CI pipeline.

## Folder Structure

client/
  public/
  src/
    components/
      base/
      enterprise/
      soc/
      ui/
    contexts/
    domain/
    hooks/
    pages/
    plugins/
    test/
server/
  observability/
shared/
.github/workflows/

## Technologies

- React
- TypeScript
- Vite
- Tailwind CSS
- Radix UI primitives
- Recharts
- Wouter
- Vitest
- React Testing Library
- ESLint
- Express
- Docker

## Installation

pnpm install

## Development

pnpm dev
pnpm dev:server

## Validation

pnpm check
pnpm lint
pnpm test
pnpm build

Or run: pnpm validate

## Production

pnpm build
pnpm start

The production server exposes /health and /metrics.

## Docker

docker compose up --build shield-security

Development profile:

docker compose --profile dev up shield-security-dev

## Security

- Helmet-powered security headers.
- CSP.
- CORS with CORS_ORIGIN.
- Rate limiting.
- JSON/body size limits.
- Structured error handling.

## Screenshots

Screenshots should be added after browser QA:

- Dashboard SOC overview.
- IOC Workspace.
- Threat Intelligence table and charts.
- MITRE ATT&CK Explorer.
- Settings and plugin registry.

## Roadmap

- Wire plugin registry to real provider APIs.
- Add authenticated analyst accounts.
- Persist cases and search history server-side.
- Add PDF export rendering service.
- Add browser-based visual regression checks.
- Add deployment-specific CSP allowlists.

## Notes

No existing analysis flow or business rule was removed during the production-readiness sprint. The changes focus on validation, tests, observability, security headers, documentation and deployability.
