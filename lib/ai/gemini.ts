/**
 * Centralized Gemini API client with fallback across model versions and fast reasoning control.
 */

const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
];

export async function callGeminiJson<T = any>(
  prompt: string, 
  apiKey?: string,
  timeoutMs: number = 14000
): Promise<T | null> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) return null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      
      // Attempt 1: with thinkingLevel: "low" for speed
      let response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${prompt}\n\nRespond strictly with valid JSON only. Do not add markdown backticks if possible.` }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
            thinkingConfig: {
              thinkingLevel: "low"
            }
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      // If 400 (model doesn't support thinkingConfig), retry without it
      if (response.status === 400) {
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${prompt}\n\nRespond strictly with valid JSON only. Do not add markdown backticks if possible.` }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      }

      if (!response.ok) {
        console.warn(`Gemini model ${model} returned status ${response.status}`);
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      // Clean up markdown fences if present
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      return JSON.parse(cleaned) as T;
    } catch (err) {
      console.warn(`Gemini model ${model} failed:`, err instanceof Error ? err.message : String(err));
    }
  }

  return null;
}
