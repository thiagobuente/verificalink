import '@testing-library/jest-dom/vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = globalThis.ResizeObserver ?? ResizeObserverMock;

// Test environment defaults for network-bound integration tests.
process.env.GOOGLE_SAFE_BROWSING_API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY || 'test-api-key';

const realFetch = globalThis.fetch?.bind(globalThis);
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (url.includes('safebrowsing.googleapis.com')) {
    return new Response(JSON.stringify({ matches: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (realFetch) return realFetch(input, init);
  throw new Error('fetch is not available in this environment');
}) as typeof fetch;
