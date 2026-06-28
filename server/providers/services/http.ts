export interface JsonRequestOptions {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
  signal: AbortSignal;
}

export class ProviderHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ProviderHttpError";
  }
}

export async function requestJson<T>(url: string, options: JsonRequestOptions): Promise<T> {
  const headers = {
    ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    Accept: "application/json",
    ...options.headers,
  };
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const suffix = body ? ": " + body.slice(0, 180) : "";
    throw new ProviderHttpError(response.status, "HTTP " + String(response.status) + suffix);
  }

  return (await response.json()) as T;
}
