import { NextResponse } from "next/server";

export async function GET() {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 5);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);

  let activeEngine = "Intelligent Local Engine";
  if (hasOpenAI) activeEngine = "OpenAI (GPT-4o-mini)";
  else if (hasGemini) activeEngine = "Google Gemini (1.5 Flash)";

  return NextResponse.json({
    activeEngine,
    hasLiveLLM: hasOpenAI || hasGemini,
    hasOpenAI,
    hasGemini,
  });
}

