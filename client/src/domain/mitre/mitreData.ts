export interface MitreTechnique {
  id: string;
  tactic: string;
  technique: string;
  mitigation: string;
  reference: string;
}

export const mitreTechniques: MitreTechnique[] = [
  { id: "T1566", tactic: "Initial Access", technique: "Phishing", mitigation: "Treinamento, filtros de email e análise de anexos.", reference: "https://attack.mitre.org/techniques/T1566/" },
  { id: "T1583", tactic: "Resource Development", technique: "Acquire Infrastructure", mitigation: "Monitorar registros DNS, certificados e domínios recém-criados.", reference: "https://attack.mitre.org/techniques/T1583/" },
  { id: "T1059", tactic: "Execution", technique: "Command and Scripting Interpreter", mitigation: "Restringir execução de scripts e aplicar allowlisting.", reference: "https://attack.mitre.org/techniques/T1059/" },
  { id: "T1105", tactic: "Command and Control", technique: "Ingress Tool Transfer", mitigation: "Inspecionar tráfego de saída e bloquear downloads suspeitos.", reference: "https://attack.mitre.org/techniques/T1105/" },
  { id: "T1110", tactic: "Credential Access", technique: "Brute Force", mitigation: "MFA, rate limiting e detecção de tentativas anômalas.", reference: "https://attack.mitre.org/techniques/T1110/" },
];
