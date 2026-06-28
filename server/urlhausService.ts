/**
 * URLhaus API Integration Service
 * Detects malicious URLs and provides threat intelligence
 * API: https://urlhaus.abuse.ch/api/
 */

export interface URLhausResult {
  query_status: string;
  url?: string;
  url_status?: string;
  threat?: string;
  tags?: string[];
  date_added?: string;
  urlhaus_reference?: string;
  takedown_time_seconds?: number;
  last_http_response_code?: number;
  last_analysis_date?: string;
}

export interface URLhausAnalysis {
  isMalicious: boolean;
  threat: string | null;
  tags: string[];
  dateAdded: string | null;
  status: string;
  reference: string | null;
}

/**
 * Check if URL is listed in URLhaus database
 */
export async function checkURLhaus(url: string): Promise<URLhausAnalysis> {
  try {
    const response = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `url=${encodeURIComponent(url)}`,
    });

    if (!response.ok) {
      console.error(`URLhaus API error: ${response.status}`);
      return {
        isMalicious: false,
        threat: null,
        tags: [],
        dateAdded: null,
        status: 'error',
        reference: null,
      };
    }

    const data: URLhausResult = await response.json();

    // Check if URL was found in URLhaus
    if (data.query_status === 'ok' && data.url_status === 'online') {
      return {
        isMalicious: true,
        threat: data.threat || 'Malicious URL detected',
        tags: data.tags || [],
        dateAdded: data.date_added || null,
        status: 'malicious',
        reference: data.urlhaus_reference || null,
      };
    }

    if (data.query_status === 'ok' && data.url_status === 'offline') {
      return {
        isMalicious: true,
        threat: data.threat || 'Malicious URL (offline)',
        tags: data.tags || [],
        dateAdded: data.date_added || null,
        status: 'offline',
        reference: data.urlhaus_reference || null,
      };
    }

    // URL not found in URLhaus
    return {
      isMalicious: false,
      threat: null,
      tags: [],
      dateAdded: null,
      status: 'clean',
      reference: null,
    };
  } catch (error) {
    console.error('URLhaus API error:', error);
    return {
      isMalicious: false,
      threat: null,
      tags: [],
      dateAdded: null,
      status: 'error',
      reference: null,
    };
  }
}

/**
 * Get URLhaus payload information
 */
export async function getURLhausPayload(url: string): Promise<any> {
  try {
    const response = await fetch('https://urlhaus-api.abuse.ch/v1/urls/recent/', {
      method: 'GET',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // Search for URL in recent payloads
    if (data.query_status === 'ok' && data.urls) {
      const found = data.urls.find((item: any) => item.url === url);
      return found || null;
    }

    return null;
  } catch (error) {
    console.error('URLhaus payload error:', error);
    return null;
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}
