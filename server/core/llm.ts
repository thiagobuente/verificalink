interface LLMMessage {
  role: string;
  content: unknown;
}

interface InvokeLLMParams {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

interface InvokeLLMResponse {
  choices: Array<{
    message: {
      content: string | unknown;
    };
  }>;
}

const apiUrl = process.env.LLM_API_URL || process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "";
const defaultModel = process.env.LLM_MODEL || "gpt-4o-mini";

export async function invokeLLM(params: InvokeLLMParams): Promise<InvokeLLMResponse> {
  if (!apiKey) {
    return { choices: [{ message: { content: "" } }] };
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model ?? defaultModel,
      messages: params.messages,
      temperature: params.temperature ?? 0,
      max_tokens: params.max_tokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed with status ${response.status}`);
  }

  return (await response.json()) as InvokeLLMResponse;
}
