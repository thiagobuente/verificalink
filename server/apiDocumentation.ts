/**
 * API Documentation & SDKs Module
 * Documentação OpenAPI/Swagger e geração de SDKs
 */

// ============================================================================
// 1. OPENAPI SCHEMA GENERATOR
// ============================================================================

export interface OpenAPIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary: string;
  description: string;
  tags: string[];
  parameters?: Array<{
    name: string;
    in: 'query' | 'path' | 'header' | 'body';
    required: boolean;
    schema: any;
    description: string;
  }>;
  requestBody?: {
    required: boolean;
    content: Record<string, any>;
  };
  responses: Record<string, {
    description: string;
    schema: any;
  }>;
  security?: Array<Record<string, string[]>>;
}

export class OpenAPIGenerator {
  private endpoints: OpenAPIEndpoint[] = [];
  private info = {
    title: 'Shield Security Scanner API',
    version: '1.0.0',
    description: 'Comprehensive security analysis API for emails, URLs, and domains',
    contact: {
      name: 'Support',
      email: 'support@shieldsecurity.com',
    },
  };

  registerEndpoint(endpoint: OpenAPIEndpoint): void {
    this.endpoints.push(endpoint);
  }

  generateSchema(): any {
    const paths: Record<string, any> = {};

    for (const endpoint of this.endpoints) {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: endpoint.responses,
        security: endpoint.security,
      };
    }

    return {
      openapi: '3.0.0',
      info: this.info,
      servers: [
        {
          url: 'https://api.shieldsecurity.com',
          description: 'Production server',
        },
        {
          url: 'https://staging-api.shieldsecurity.com',
          description: 'Staging server',
        },
      ],
      paths,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          apiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
          Analysis: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['email', 'url', 'domain'] },
              target: { type: 'string' },
              score: { type: 'number', minimum: 0, maximum: 100 },
              threats: { type: 'array', items: { type: 'object' } },
              timestamp: { type: 'number' },
            },
          },
        },
      },
    };
  }

  getJSON(): string {
    return JSON.stringify(this.generateSchema(), null, 2);
  }

  getYAML(): string {
    // Simplified YAML generation
    const schema = this.generateSchema();
    return `openapi: ${schema.openapi}
info:
  title: ${schema.info.title}
  version: ${schema.info.version}
  description: ${schema.info.description}
`;
  }
}

// ============================================================================
// 2. INTERACTIVE DOCUMENTATION
// ============================================================================

export class InteractiveDocumentation {
  private openapi: OpenAPIGenerator;

  constructor(openapi: OpenAPIGenerator) {
    this.openapi = openapi;
  }

  generateHTML(): string {
    const schema = this.openapi.generateSchema();

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Shield Security Scanner API Documentation</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Roboto', sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    .api-endpoint {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      background: #f9f9f9;
    }
    .method {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 4px;
      font-weight: bold;
      color: white;
      margin-right: 10px;
    }
    .method.get { background: #61affe; }
    .method.post { background: #49cc90; }
    .method.put { background: #fca130; }
    .method.delete { background: #f93e3e; }
    .endpoint-path {
      font-family: 'Courier New', monospace;
      background: #f0f0f0;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
    }
    .parameters {
      margin: 15px 0;
    }
    .parameter {
      margin: 10px 0;
      padding: 10px;
      background: white;
      border-left: 3px solid #667eea;
    }
    .response-example {
      background: #f0f0f0;
      padding: 15px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <header>
    <h1>🛡️ Shield Security Scanner</h1>
    <p>API Documentation</p>
  </header>

  <div class="container">
    <h2>Available Endpoints</h2>
    
    ${this.generateEndpointHTML(schema.paths)}
  </div>
</body>
</html>
    `;
  }

  private generateEndpointHTML(paths: Record<string, any>): string {
    let html = '';

    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, details] of Object.entries(methods)) {
        const methodUpper = method.toUpperCase();
        html += `
          <div class="api-endpoint">
            <div>
              <span class="method ${method}">${methodUpper}</span>
              <span class="endpoint-path">${path}</span>
            </div>
            <h3>${(details as any).summary}</h3>
            <p>${(details as any).description}</p>
          </div>
        `;
      }
    }

    return html;
  }
}

// ============================================================================
// 3. SDK GENERATOR
// ============================================================================

export class SDKGenerator {
  private baseUrl: string;
  private apiVersion: string;

  constructor(baseUrl: string = 'https://api.shieldsecurity.com', apiVersion: string = 'v1') {
    this.baseUrl = baseUrl;
    this.apiVersion = apiVersion;
  }

  generatePythonSDK(): string {
    return `
"""
Shield Security Scanner Python SDK
"""

import requests
from typing import Dict, List, Optional

class ShieldClient:
    def __init__(self, api_key: str, base_url: str = "${this.baseUrl}"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        }

    def analyze_email(self, email: str) -> Dict:
        """Analyze an email address for security threats"""
        response = requests.post(
            f"{self.base_url}/api/analyze/email",
            json={"email": email},
            headers=self.headers
        )
        return response.json()

    def analyze_url(self, url: str) -> Dict:
        """Analyze a URL for security threats"""
        response = requests.post(
            f"{self.base_url}/api/analyze/url",
            json={"url": url},
            headers=self.headers
        )
        return response.json()

    def analyze_domain(self, domain: str) -> Dict:
        """Analyze a domain for security threats"""
        response = requests.post(
            f"{self.base_url}/api/analyze/domain",
            json={"domain": domain},
            headers=self.headers
        )
        return response.json()

    def get_analysis_history(self, limit: int = 100) -> List[Dict]:
        """Get analysis history"""
        response = requests.get(
            f"{self.base_url}/api/history",
            params={"limit": limit},
            headers=self.headers
        )
        return response.json()

# Usage example:
# client = ShieldClient("your-api-key")
# result = client.analyze_email("test@example.com")
# print(result)
    `;
  }

  generateJavaScriptSDK(): string {
    return `
/**
 * Shield Security Scanner JavaScript SDK
 */

class ShieldClient {
  constructor(apiKey, baseUrl = "${this.baseUrl}") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.headers = {
      "X-API-Key": apiKey,
      "Content-Type": "application/json"
    };
  }

  async analyzeEmail(email) {
    const response = await fetch(\`\${this.baseUrl}/api/analyze/email\`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ email })
    });
    return response.json();
  }

  async analyzeUrl(url) {
    const response = await fetch(\`\${this.baseUrl}/api/analyze/url\`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ url })
    });
    return response.json();
  }

  async analyzeDomain(domain) {
    const response = await fetch(\`\${this.baseUrl}/api/analyze/domain\`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ domain })
    });
    return response.json();
  }

  async getAnalysisHistory(limit = 100) {
    const response = await fetch(
      \`\${this.baseUrl}/api/history?limit=\${limit}\`,
      { headers: this.headers }
    );
    return response.json();
  }
}

// Usage example:
// const client = new ShieldClient("your-api-key");
// const result = await client.analyzeEmail("test@example.com");
// console.log(result);

export default ShieldClient;
    `;
  }

  generateGoSDK(): string {
    return `
package shield

import (
  "bytes"
  "encoding/json"
  "fmt"
  "io"
  "net/http"
)

type Client struct {
  APIKey  string
  BaseURL string
  Client  *http.Client
}

type AnalysisRequest struct {
  Email  string \`json:"email,omitempty"\`
  URL    string \`json:"url,omitempty"\`
  Domain string \`json:"domain,omitempty"\`
}

type AnalysisResponse struct {
  ID    string  \`json:"id"\`
  Type  string  \`json:"type"\`
  Score float64 \`json:"score"\`
  Data  map[string]interface{} \`json:"data"\`
}

func NewClient(apiKey string) *Client {
  return &Client{
    APIKey:  apiKey,
    BaseURL: "${this.baseUrl}",
    Client:  &http.Client{},
  }
}

func (c *Client) AnalyzeEmail(email string) (*AnalysisResponse, error) {
  return c.analyze("email", AnalysisRequest{Email: email})
}

func (c *Client) AnalyzeURL(url string) (*AnalysisResponse, error) {
  return c.analyze("url", AnalysisRequest{URL: url})
}

func (c *Client) AnalyzeDomain(domain string) (*AnalysisResponse, error) {
  return c.analyze("domain", AnalysisRequest{Domain: domain})
}

func (c *Client) analyze(analysisType string, req AnalysisRequest) (*AnalysisResponse, error) {
  body, _ := json.Marshal(req)

  httpReq, _ := http.NewRequest(
    "POST",
    fmt.Sprintf("%s/api/analyze/%s", c.BaseURL, analysisType),
    bytes.NewBuffer(body),
  )

  httpReq.Header.Set("X-API-Key", c.APIKey)
  httpReq.Header.Set("Content-Type", "application/json")

  resp, err := c.Client.Do(httpReq)
  if err != nil {
    return nil, err
  }
  defer resp.Body.Close()

  respBody, _ := io.ReadAll(resp.Body)
  var result AnalysisResponse
  json.Unmarshal(respBody, &result)

  return &result, nil
}
    `;
  }
}

// ============================================================================
// 4. CODE EXAMPLES
// ============================================================================

export class CodeExamples {
  static getEmailAnalysisExample(): string {
    return `
# Analyze an email address

curl -X POST https://api.shieldsecurity.com/api/analyze/email \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com"
  }'

# Response:
{
  "id": "analysis_123",
  "type": "email",
  "target": "test@example.com",
  "score": 75,
  "spf": {
    "status": "valid",
    "mechanisms": 3
  },
  "dkim": {
    "status": "invalid",
    "error": "No DKIM record found"
  },
  "dmarc": {
    "status": "valid",
    "policy": "reject"
  },
  "threats": [],
  "timestamp": 1234567890
}
    `;
  }

  static getURLAnalysisExample(): string {
    return `
# Analyze a URL

curl -X POST https://api.shieldsecurity.com/api/analyze/url \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/page"
  }'

# Response:
{
  "id": "analysis_456",
  "type": "url",
  "target": "https://example.com/page",
  "score": 85,
  "threats": [
    {
      "type": "phishing",
      "severity": "high",
      "description": "URL matches known phishing pattern"
    }
  ],
  "reputation": {
    "virustotal_score": 0,
    "spamhaus_status": "clean"
  },
  "timestamp": 1234567890
}
    `;
  }
}
