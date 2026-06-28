export type ExportFormat = "json" | "csv" | "pdf";

export function exportJson(data: unknown) {
  return JSON.stringify(data, null, 2);
}

export function exportCsv<T extends object>(rows: T[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0] as Record<string, unknown>);
  const escape = (value: unknown) => '"' + String(value ?? "").replaceAll('"', '""') + '"';
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape((row as Record<string, unknown>)[header])).join(","))].join("\n");
}

export function buildPdfReadyReport(data: unknown) {
  return { generatedAt: new Date().toISOString(), format: "pdf-ready", data };
}
