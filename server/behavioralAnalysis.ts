import { getCache, setCache, cacheKeys, cacheTTL } from './cache';

interface DomainBehavior {
  domain: string;
  age: number; // days
  registrar: string;
  country: string;
  spfRecords: number;
  dkimRecords: number;
  dmarcPolicy: string;
  mxRecords: number;
  nameservers: string[];
  previousThreats: number;
  reportedCount: number;
  lastReportedAt?: Date;
}

interface BehavioralScore {
  domain: string;
  score: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  anomalies: string[];
  patterns: string[];
  confidence: number; // 0-100
  reasoning: string[];
}

class BehavioralAnalyzer {
  // Machine learning patterns based on known phishing/malware domains
  private phishingPatterns = [
    /paypa[l1]/i,
    /amaz[o0]n/i,
    /micr[o0]s[o0]ft/i,
    /app[l1]e/i,
    /g[o0]ogle/i,
    /[a-z0-9]*-[a-z0-9]*-[a-z0-9]*/i, // Multiple hyphens
    /[a-z0-9]{20,}/i, // Very long random strings
  ];

  private suspiciousPatterns = [
    /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/, // IP as domain
    /xn--/i, // Punycode
    /bit\.ly|tinyurl|short\.link/i, // URL shorteners
    /\.tk|\.ml|\.ga|\.cf/i, // Free TLDs
    /[a-z0-9]{3,}[0-9]{5,}/i, // Random + numbers
  ];

  async analyzeBehavior(domain: string, behavior: DomainBehavior): Promise<BehavioralScore> {
    // Check cache first
    const cached = await getCache<BehavioralScore>(cacheKeys.analysis(domain));
    if (cached) {
      return cached;
    }

    const anomalies: string[] = [];
    const patterns: string[] = [];
    const reasoning: string[] = [];
    let score = 0;

    // 1. Domain Age Analysis
    if (behavior.age < 7) {
      score += 25;
      anomalies.push('Very new domain');
      reasoning.push('Domains created less than 7 days ago are 3x more likely to be malicious');
    } else if (behavior.age < 30) {
      score += 15;
      anomalies.push('Recently created domain');
      reasoning.push('Domains less than 30 days old show higher risk');
    } else if (behavior.age > 3650) {
      score -= 5; // Reduce score for very old domains
    }

    // 2. SPF/DKIM/DMARC Analysis
    if (behavior.spfRecords === 0) {
      score += 20;
      anomalies.push('No SPF record');
      reasoning.push('Missing SPF record enables email spoofing');
    }
    if (behavior.dkimRecords === 0) {
      score += 15;
      anomalies.push('No DKIM record');
      reasoning.push('Missing DKIM record prevents email authentication');
    }
    if (behavior.dmarcPolicy !== 'reject') {
      score += 10;
      anomalies.push(`DMARC policy is ${behavior.dmarcPolicy || 'missing'}`);
      reasoning.push('DMARC policy should be "reject" for maximum security');
    }

    // 3. MX Records Analysis
    if (behavior.mxRecords === 0) {
      score += 30;
      anomalies.push('No MX records');
      reasoning.push('No mail servers configured - likely not a legitimate email domain');
    } else if (behavior.mxRecords > 10) {
      score += 10;
      anomalies.push('Unusually high number of MX records');
      reasoning.push('More than 10 MX records is suspicious');
    }

    // 4. Nameserver Analysis
    if (behavior.nameservers.length < 2) {
      score += 15;
      anomalies.push('Less than 2 nameservers');
      reasoning.push('Legitimate domains typically have at least 2 nameservers');
    }

    // 5. Pattern Matching
    for (const pattern of this.phishingPatterns) {
      if (pattern.test(domain)) {
        score += 20;
        patterns.push(`Matches phishing pattern: ${pattern.source}`);
        reasoning.push('Domain mimics known brand names');
      }
    }

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(domain)) {
        score += 15;
        patterns.push(`Matches suspicious pattern: ${pattern.source}`);
        reasoning.push('Domain uses suspicious structure or TLD');
      }
    }

    // 6. Historical Threat Analysis
    if (behavior.previousThreats > 0) {
      score += Math.min(behavior.previousThreats * 10, 30);
      anomalies.push(`${behavior.previousThreats} previous threats detected`);
      reasoning.push('Domain has history of malicious activity');
    }

    if (behavior.reportedCount > 0) {
      score += Math.min(behavior.reportedCount * 5, 20);
      anomalies.push(`Reported ${behavior.reportedCount} times`);
      reasoning.push('Domain has been reported by users');
    }

    // 7. Registrar Analysis
    const suspiciousRegistrars = ['namecheap', 'godaddy', 'freenom'];
    if (suspiciousRegistrars.some(r => behavior.registrar?.toLowerCase().includes(r))) {
      score += 5;
      patterns.push('Registered with common low-cost registrar');
    }

    // 8. Country Analysis
    const highRiskCountries = ['CN', 'RU', 'KP', 'IR'];
    if (highRiskCountries.includes(behavior.country)) {
      score += 10;
      anomalies.push(`Domain registered in high-risk country: ${behavior.country}`);
      reasoning.push('Domain registered in country with high cybercrime activity');
    }

    // Normalize score to 0-100
    score = Math.min(100, Math.max(0, score));

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 80) riskLevel = 'critical';
    else if (score >= 60) riskLevel = 'high';
    else if (score >= 40) riskLevel = 'medium';
    else riskLevel = 'low';

    // Calculate confidence based on number of signals
    const totalSignals = anomalies.length + patterns.length;
    const confidence = Math.min(100, 50 + totalSignals * 10);

    const result: BehavioralScore = {
      domain,
      score,
      riskLevel,
      anomalies,
      patterns,
      confidence,
      reasoning,
    };

    // Cache the result
    await setCache(cacheKeys.analysis(domain), result, cacheTTL.analysis);

    return result;
  }

  // Detect anomalies in domain behavior changes
  async detectAnomalies(domain: string, currentBehavior: DomainBehavior, previousBehavior?: DomainBehavior): Promise<string[]> {
    const anomalies: string[] = [];

    if (previousBehavior) {
      // Check for sudden changes
      if (currentBehavior.spfRecords !== previousBehavior.spfRecords) {
        anomalies.push('SPF records changed');
      }
      if (currentBehavior.dkimRecords !== previousBehavior.dkimRecords) {
        anomalies.push('DKIM records changed');
      }
      if (currentBehavior.dmarcPolicy !== previousBehavior.dmarcPolicy) {
        anomalies.push('DMARC policy changed');
      }
      if (currentBehavior.mxRecords !== previousBehavior.mxRecords) {
        anomalies.push('MX records changed');
      }

      // Check for nameserver changes (possible compromise)
      const nsChanged = currentBehavior.nameservers.some(ns => !previousBehavior.nameservers.includes(ns));
      if (nsChanged) {
        anomalies.push('Nameservers changed - possible domain compromise');
      }
    }

    return anomalies;
  }

  // Predict likelihood of phishing based on patterns
  predictPhishingLikelihood(domain: string): number {
    let likelihood = 0;

    // Check brand impersonation
    const brands = ['paypal', 'amazon', 'microsoft', 'apple', 'google', 'facebook', 'twitter', 'instagram'];
    for (const brand of brands) {
      if (domain.includes(brand)) {
        likelihood += 30;
        break;
      }
    }

    // Check for homograph attacks (similar looking characters)
    if (/[l1]|[o0]|[s5]/.test(domain)) {
      likelihood += 15;
    }

    // Check for excessive subdomains
    if ((domain.match(/\./g) || []).length > 3) {
      likelihood += 10;
    }

    return Math.min(100, likelihood);
  }
}

export const behavioralAnalyzer = new BehavioralAnalyzer();
