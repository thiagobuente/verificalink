const endpoints = ['/api/providers/health','/api/ioc/aggregate','/api/soc-actions','/api/attack-intelligence','/api/attack-narratives','/api/soc/command-center/feed'];
console.log(JSON.stringify({ endpoints, note: 'Run against a local server with x-tenant-id header.' }, null, 2));
