export const GoldenIOCSet = [
  { name: 'known malicious IP', ioc: '203.0.113.66', type: 'ip', expectedRisk: 'high' },
  { name: 'known benign IP', ioc: '8.8.8.8', type: 'ip', expectedRisk: 'low' },
  { name: 'known scanning URL', ioc: 'https://scanner.example.test/login', type: 'url', expectedRisk: 'medium' },
  { name: 'known malware hash', ioc: '44d88612fea8a8f36de82e1278abb02f', type: 'hash', expectedRisk: 'high' },
] as const;
