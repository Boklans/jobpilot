import { NextRequest, NextResponse } from "next/server";
import { JobListing } from "@/types";
import { callGeminiJson } from "@/lib/ai/gemini";

export const maxDuration = 30;

function cleanHtmlToText(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
  text = text.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ");
  text = text.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ");
  text = text.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ");
  text = text.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ");

  // Isolate vacancy body if on DOU or Djinni
  const douSection = text.match(/<div class="[^"]*vacancy-section[^"]*">([\s\S]*?)<\/div>/i) ||
                     text.match(/<div class="[^"]*b-typo[^"]*">([\s\S]*?)<\/div>/i);
  if (douSection) {
    text = douSection[1];
  }

  // Strip remaining tags
  text = text.replace(/<br\s*[\/]?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<\/li>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");

  // Decode basic HTML entities
  text = text.replace(/&nbsp;/g, " ")
             .replace(/&amp;/g, "&")
             .replace(/&lt;/g, "<")
             .replace(/&gt;/g, ">")
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");

  // Normalize whitespace
  return text.split("\n").map(l => l.trim()).filter(Boolean).join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();
    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Вхідний текст або посилання відсутнє" }, { status: 400 });
    }

    const trimmedInput = input.trim();
    const isUrl = trimmedInput.startsWith("http://") || trimmedInput.startsWith("https://");

    let pageText = trimmedInput;
    let urlTitle = "";
    let urlCompany = "";

    if (isUrl) {
      try {
        const response = await fetch(trimmedInput, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
          },
          signal: AbortSignal.timeout(12000),
        });

        if (response.ok) {
          const html = await response.text();

          // Extract meta title & h1
          const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
          if (h1Match) {
            urlTitle = h1Match[1].replace(/<[^>]+>/g, "").trim();
          }

          // DOU company extract
          if (trimmedInput.includes("dou.ua")) {
            const compMatch = html.match(/<div class="l-n">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
                              html.match(/<a class="company"[^>]*>([\s\S]*?)<\/a>/i);
            if (compMatch) {
              urlCompany = compMatch[1].replace(/<[^>]+>/g, "").trim();
            }
          }

          pageText = cleanHtmlToText(html);
        } else {
          console.warn("Failed to fetch vacancy URL:", response.status);
        }
      } catch (fetchErr) {
        console.warn("Error fetching vacancy URL:", fetchErr);
      }
    }

    // Try AI extraction of structured job metadata
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && pageText.length > 50) {
      const prompt = `You are a Tech Job Parser. Analyze this job vacancy text and extract key metadata into strict JSON format:
{
  "title": string (Job title, e.g. "Senior .NET Software Engineer"),
  "company": string (Company name, e.g. "Lime Systems" or "Murano Software"),
  "location": string (e.g. "Remote", "Kyiv, Ukraine", "Hybrid"),
  "salary": string or null (e.g. "$4,000 - $5,500" if mentioned, else null),
  "summary": string (2-3 sentences overview of the role and project),
  "keyRequirements": string[] (Array of key required skills, stack, experience)
}

Job text (truncated):
${pageText.slice(0, 6000)}`;

      const parsed = await callGeminiJson<any>(prompt, geminiKey);
      if (parsed && parsed.title) {
        const job: JobListing = {
          id: "job-" + Date.now(),
          title: parsed.title || urlTitle || "Software Engineer",
          company: parsed.company || urlCompany || (isUrl ? "Tech Company" : "Company"),
          location: parsed.location || "Remote / Hybrid",
          salary: parsed.salary || undefined,
          sourceUrl: isUrl ? trimmedInput : undefined,
          rawDescription: pageText.length > 100 ? pageText : trimmedInput,
          createdAt: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, job });
      }
    }

    // Fallback heuristic extraction
    const lines = pageText.split("\n").map(l => l.trim()).filter(Boolean);
    const guessedTitle = urlTitle || lines[0]?.slice(0, 60) || "Software Engineer";
    const guessedCompany = urlCompany || (isUrl && trimmedInput.includes("lime-systems") ? "Lime Systems" : isUrl && trimmedInput.includes("murano-software") ? "Murano Software" : "Tech Company");

    const job: JobListing = {
      id: "job-" + Date.now(),
      title: guessedTitle,
      company: guessedCompany,
      location: "Remote / Hybrid",
      sourceUrl: isUrl ? trimmedInput : undefined,
      rawDescription: pageText.length > 50 ? pageText : trimmedInput,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    console.error("Parse job error:", error);
    return NextResponse.json({ error: error.message || "Помилка обробки вакансії" }, { status: 500 });
  }
}
