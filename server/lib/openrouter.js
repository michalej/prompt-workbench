const API_BASE = 'https://openrouter.ai/api/v1';
const API_KEY = process.env.OPENROUTER_API_KEY;

async function chatCompletion({ model, messages, temperature = 0.7, maxTokens = 4096, responseFormat, webSearch }) {
  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (responseFormat) body.response_format = responseFormat;
  if (webSearch) {
    body.plugins = [{ id: 'web-search' }];
  }

  const start = Date.now();
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://prompt.185.238.74.74.nip.io',
      'X-Title': 'Prompt Workbench',
    },
    body: JSON.stringify(body),
  });

  const latencyMs = Date.now() - start;
  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }

  const choice = data.choices?.[0];
  const usage = data.usage || {};
  return {
    output: choice?.message?.content || '',
    tokensIn: usage.prompt_tokens || 0,
    tokensOut: usage.completion_tokens || 0,
    cost: null,
    latencyMs,
  };
}

let modelsCache = null;
let modelsCacheTime = 0;

async function listModels() {
  if (modelsCache && Date.now() - modelsCacheTime < 3600000) return modelsCache;
  const res = await fetch(`${API_BASE}/models`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` },
  });
  const data = await res.json();
  modelsCache = data.data || [];
  modelsCacheTime = Date.now();
  return modelsCache;
}

module.exports = { chatCompletion, listModels };
