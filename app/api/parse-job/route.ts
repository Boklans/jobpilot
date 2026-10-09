import { NextRequest, NextResponse } from "next/server";
import { JobListing } from "@/types";
import { callGeminiJson } from "@/lib/ai/gemini";

export const maxDuration = 30;

function formatSalary(sal: any): string | undefined {
  if (!sal) return undefined;
  if (typeof sal === "string") return sal.trim();
  if (typeof sal === "object") {
    const cur = sal.currency === "USD" ? "$" : sal.currency === "EUR" ? "€" : sal.currency === "UAH" ? "грн " : (sal.currency ? `${sal.currency} ` : "$");
    if (sal.value) return `${cur}${sal.value}`;
    if (sal.minValue && sal.maxValue) return `${cur}${sal.minValue} - ${cur}${sal.maxValue}`;
    if (sal.minValue) return `від ${cur}${sal.minValue}`;
    if (sal.maxValue) return `до ${cur}${sal.maxValue}`;
  }
  return undefined;
}

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
    let urlSalary: string | undefined = undefined;
    let urlLocation = "Remote / Hybrid";

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

          // 1. JSON-LD Schema.org (Standard across modern job boards: Djinni, DOU, Robota, LinkedIn, Greenhouse, etc.)
          const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
          if (jsonLdMatches) {
            for (const scriptTag of jsonLdMatches) {
              try {
                const jsonText = scriptTag.replace(/<script[^>]*>|<\/script>/gi, "").trim();
                const data = JSON.parse(jsonText);
                if (data["@type"] === "JobPosting" || data.title) {
                  if (!urlTitle && data.title) {
                    urlTitle = String(data.title).trim();
                  }
                  if (!urlCompany && data.hiringOrganization) {
                    if (typeof data.hiringOrganization === "object" && data.hiringOrganization.name) {
                      urlCompany = String(data.hiringOrganization.name).trim();
                    } else if (typeof data.hiringOrganization === "string") {
                      urlCompany = data.hiringOrganization.trim();
                    }
                  }
                  if (!urlSalary && (data.estimatedSalary || data.baseSalary)) {
                    urlSalary = formatSalary(data.estimatedSalary || data.baseSalary);
                  }
                  if (data.jobLocationType === "TELECOMMUTE") {
                    urlLocation = "Remote";
                  }
                }
              } catch (e) {
                // Ignore JSON parse error in individual script
              }
            }
          }

          // 2. Djinni / DOU title tag: e.g. "Senior Full-Stack Developer (Node.js+React) в YozmaTech – Djinni"
          const titleTagMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
          if (titleTagMatch) {
            const rawTitleTag = titleTagMatch[1].replace(/<[^>]+>/g, "").trim();
            // Djinni pattern: "{Title} в/at {Company} – Djinni"
            const djinniTitleMatch = rawTitleTag.match(/^(.*?)\s+(?:в|at)\s+(.*?)\s+[–—-]\s+Djinni/i);
            if (djinniTitleMatch) {
              if (!urlTitle) urlTitle = djinniTitleMatch[1].trim();
              if (!urlCompany) urlCompany = djinniTitleMatch[2].trim();
            }
            // DOU pattern: "{Title} в {Company} | DOU"
            const douTitleMatch = rawTitleTag.match(/^(.*?)\s+(?:в|at)\s+(.*?)\s+[|–—-]\s+DOU/i);
            if (douTitleMatch) {
              if (!urlTitle) urlTitle = douTitleMatch[1].trim();
              if (!urlCompany) urlCompany = douTitleMatch[2].trim();
            }
          }

          // 3. Exact H1 tag
          if (!urlTitle) {
            const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
            if (h1Match) {
              urlTitle = h1Match[1].replace(/<[^>]+>/g, "").trim();
            }
          }

          // 4. Meta / OpenGraph fallback
          if (!urlTitle) {
            const ogTitle = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["'](.*?)["']/i);
            if (ogTitle && ogTitle[1]) {
              urlTitle = ogTitle[1].replace(/<[^>]+>/g, "").trim();
            }
          }

          // 5. Djinni company extract (Modern Djinni DOM + URL slug)
          if (trimmedInput.includes("djinni.co")) {
            if (!urlCompany) {
              const compLink = html.match(/<a[^>]*href=["'](?:https:\/\/djinni\.co)?\/jobs\/company-([^"'/]+)\/["'][^>]*>([\s\S]*?)<\/a>/i);
              if (compLink && compLink[2]) {
                const cleaned = compLink[2].replace(/<[^>]+>/g, "").trim();
                if (cleaned && !cleaned.includes("<") && cleaned.length < 100) {
                  urlCompany = cleaned;
                }
              }
            }
            if (!urlCompany) {
              const slugMatch = html.match(/\/jobs\/company-([^"'/]+)\//i) || trimmedInput.match(/\/jobs\/company-([^"'/]+)\//i);
              if (slugMatch && slugMatch[1]) {
                urlCompany = slugMatch[1].split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
              }
            }
          }

          // 6. DOU company extract (DOM + URL slug)
          if (trimmedInput.includes("dou.ua")) {
            if (!urlCompany) {
              const compMatch = html.match(/<div class="l-n">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
                                html.match(/<a class="company"[^>]*>([\s\S]*?)<\/a>/i);
              if (compMatch) {
                urlCompany = compMatch[1].replace(/<[^>]+>/g, "").trim();
              }
            }
            if (!urlCompany) {
              const douSlugMatch = trimmedInput.match(/\/companies\/([^\/]+)\/vacancies\//i);
              if (douSlugMatch && douSlugMatch[1]) {
                urlCompany = decodeURIComponent(douSlugMatch[1]).split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
              }
            }
          }

          // 7. Work.ua & Robota.ua extract
          if (trimmedInput.includes("work.ua")) {
            const workComp = html.match(/<a[^>]*href=["']\/jobs\/by-company\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
            if (workComp) urlCompany = workComp[1].replace(/<[^>]+>/g, "").trim();
          } else if (trimmedInput.includes("robota.ua")) {
            const robotaComp = html.match(/<a[^>]*href=["']\/company[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
            if (robotaComp) urlCompany = robotaComp[1].replace(/<[^>]+>/g, "").trim();
          }

          pageText = cleanHtmlToText(html);

          // Fast return when BOTH title and company have been accurately extracted!
          if (urlTitle && urlCompany && pageText.length > 50) {
            const job: JobListing = {
              id: "job-" + Date.now(),
              title: urlTitle,
              company: urlCompany,
              location: urlLocation,
              salary: urlSalary,
              sourceUrl: trimmedInput,
              rawDescription: pageText,
              createdAt: new Date().toISOString(),
            };
            return NextResponse.json({ success: true, job });
          }
        }
      } catch (fetchErr) {
        console.warn("Error fetching vacancy URL:", fetchErr);
      }
    }

    // Fallback AI extraction for raw text or difficult URLs
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && pageText.length > 50) {
      const prompt = `You are an expert Tech Job Parser. Analyze this vacancy text and extract job title, hiring company name, location, and salary into strict JSON format:
{
  "title": string (e.g. "Senior Full-Stack Developer (Node.js+React)"),
  "company": string (e.g. "YozmaTech"),
  "location": string (e.g. "Remote / Hybrid"),
  "salary": string or null (e.g. "$2500 - $4000")
}

IMPORTANT RULES:
1. Search carefully for the hiring company name in intros ("Meet the ...", "About ...", "Join our team at ..."), signatures, or company links.
2. NEVER return generic placeholders like "Tech Company", "DOU Employer", or "Employer" if a company name or brand is mentioned anywhere.

Job text (first 3500 chars):
${pageText.slice(0, 3500)}`;

      const parsed = await callGeminiJson<any>(prompt, geminiKey);
      if (parsed && parsed.title) {
        const job: JobListing = {
          id: "job-" + Date.now(),
          title: urlTitle || parsed.title || "Software Engineer",
          company: urlCompany || (parsed.company && parsed.company !== "Tech Company" ? parsed.company : (trimmedInput.includes("djinni.co") ? "Djinni Opportunity" : "Company")),
          location: parsed.location || urlLocation,
          salary: urlSalary || (parsed.salary || undefined),
          sourceUrl: isUrl ? trimmedInput : undefined,
          rawDescription: pageText.length > 100 ? pageText : trimmedInput,
          createdAt: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, job });
      }
    }

    // Heuristic fallback
    const lines = pageText.split("\n").map(l => l.trim()).filter(Boolean);
    const guessedTitle = urlTitle || lines[0]?.slice(0, 60) || "Software Engineer";
    
    let guessedCompany = urlCompany;
    if (!guessedCompany) {
      const companyInText = pageText.match(/(?:Meet the|About|Join the team at|at)\s+([A-Z][A-Za-z0-9\s]{2,25})/i);
      if (companyInText) {
        guessedCompany = companyInText[1].trim();
      } else if (trimmedInput.includes("djinni.co")) {
        guessedCompany = "Djinni Opportunity";
      } else if (trimmedInput.includes("dou.ua")) {
        guessedCompany = "DOU Employer";
      } else {
        guessedCompany = "Employer";
      }
    }

    const job: JobListing = {
      id: "job-" + Date.now(),
      title: guessedTitle,
      company: guessedCompany,
      location: urlLocation,
      salary: urlSalary,
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
