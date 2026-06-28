/**
 * Integração com Google Safe Browsing API
 * Verifica URLs contra banco de dados de malware, phishing e software indesejado
 * Documentação: https://developers.google.com/safe-browsing/v4
 */

export interface SafeBrowsingResult {
  isMalicious: boolean;
  threats: ThreatType[];
  source: "google-safe-browsing";
  timestamp: number;
}

export type ThreatType = "MALWARE" | "SOCIAL_ENGINEERING" | "UNWANTED_SOFTWARE" | "POTENTIALLY_HARMFUL_APPLICATION";

/**
 * Verifica URL contra Google Safe Browsing API
 * Requer GOOGLE_SAFE_BROWSING_API_KEY no .env
 */
export async function checkURLWithSafeBrowsing(url: string): Promise<SafeBrowsingResult> {
  try {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    
    if (!apiKey) {
      console.warn("Google Safe Browsing API key not configured");
      return {
        isMalicious: false,
        threats: [],
        source: "google-safe-browsing",
        timestamp: Date.now()
      };
    }

    const requestBody = {
      client: {
        clientId: "shield-security",
        clientVersion: "1.0.0"
      },
      threatInfo: {
        threatTypes: [
          "MALWARE",
          "SOCIAL_ENGINEERING",
          "UNWANTED_SOFTWARE",
          "POTENTIALLY_HARMFUL_APPLICATION"
        ],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"]
      },
      threatEntries: [
        {
          url: url
        }
      ]
    };

    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      console.error(`Safe Browsing API error: ${response.status}`);
      return {
        isMalicious: false,
        threats: [],
        source: "google-safe-browsing",
        timestamp: Date.now()
      };
    }

    const data = await response.json();

    // Se há matches, a URL é maliciosa
    if (data.matches && data.matches.length > 0) {
      const threatTypes = data.matches
        .map((match: any) => match.threatType)
        .filter((threat: string, index: number, self: string[]) => self.indexOf(threat) === index);

      return {
        isMalicious: true,
        threats: threatTypes,
        source: "google-safe-browsing",
        timestamp: Date.now()
      };
    }

    return {
      isMalicious: false,
      threats: [],
      source: "google-safe-browsing",
      timestamp: Date.now()
    };
  } catch (erro) {
    console.error("Error checking URL with Safe Browsing API:", erro);
    return {
      isMalicious: false,
      threats: [],
      source: "google-safe-browsing",
      timestamp: Date.now()
    };
  }
}

/**
 * Formata resultado da API para exibição
 */
export function formatarThreatType(threat: ThreatType): string {
  const threatMap: Record<ThreatType, string> = {
    MALWARE: "Malware detectado",
    SOCIAL_ENGINEERING: "Phishing/Engenharia Social",
    UNWANTED_SOFTWARE: "Software indesejado",
    POTENTIALLY_HARMFUL_APPLICATION: "Aplicação potencialmente prejudicial"
  };

  return threatMap[threat] || threat;
}
