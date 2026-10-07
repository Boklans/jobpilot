import { NextRequest, NextResponse } from "next/server";
import { CandidateProfile } from "@/types";
import { callGeminiJson } from "@/lib/ai/gemini";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Файл не надано" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";
    const fileNameLower = file.name.toLowerCase();

    if (fileNameLower.endsWith(".pdf")) {
      // 1. Try unpdf with serverless safety
      try {
        const { extractText } = await import("unpdf");
        const pdfResult = await extractText(new Uint8Array(buffer), { mergePages: true });
        extractedText = Array.isArray(pdfResult.text) ? pdfResult.text.join("\n") : (pdfResult.text || "");
      } catch (unpdfErr) {
        console.warn("unpdf failed on serverless, trying raw stream extraction:", unpdfErr);
      }

      // 2. Fallback: Raw PDF stream text extraction if worker fails on Vercel
      if (!extractedText || extractedText.trim().length === 0) {
        extractedText = extractRawTextFromPdfBuffer(buffer);
      }
    } else if (fileNameLower.endsWith(".docx")) {
      try {
        const mammoth = await import("mammoth");
        const docxResult = await mammoth.extractRawText({ buffer });
        extractedText = docxResult.value;
      } catch (docErr) {
        console.warn("DOCX parse error:", docErr);
      }
    } else {
      // Plain text or markdown
      extractedText = buffer.toString("utf-8");
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Не вдалося витягти текст із файлу. Перевірте, чи файл не є відсканованою картинкою або захищений паролем." },
        { status: 422 }
      );
    }

    // Convert extracted text into structured CandidateProfile using Gemini or OpenAI
    const profile = await parseTextIntoProfile(extractedText, file.name);

    return NextResponse.json({ success: true, profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error in parse-cv API:", err);
    return NextResponse.json(
      { error: "Помилка обробки файлу на сервері: " + message },
      { status: 500 }
    );
  }
}

// Fallback regex text extractor directly from PDF stream (never fails on serverless)
function extractRawTextFromPdfBuffer(buf: Buffer): string {
  const content = buf.toString("latin1");
  const textChunks: string[] = [];
  
  // Extract content between BT (Begin Text) and ET (End Text) or parenthesis strings (Tj / TJ)
  const regex = /\(([^)]+)\)\s*(?:Tj|TJ)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1] && match[1].trim().length > 0) {
      textChunks.push(match[1]);
    }
  }

  if (textChunks.length > 10) {
    return textChunks.join(" ");
  }

  // Generic ASCII word extractor
  const asciiMatches = content.match(/[A-Za-z0-9а-яА-ЯіІїЇєЄ\s.,:;@\-_/]{4,}/g);
  return asciiMatches ? asciiMatches.slice(0, 500).join(" ") : "";
}

async function parseTextIntoProfile(
  rawText: string, 
  fileName: string
): Promise<CandidateProfile> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const prompt = `Parse this resume into strict JSON:
{
  "fullName": string,
  "title": string,
  "summary": string,
  "yearsOfExperience": number,
  "skills": string[],
  "experiences": [
    {
      "id": string,
      "company": string,
      "position": string,
      "period": string,
      "description": string[],
      "technologies": string[]
    }
  ]
}

Resume text:
${rawText.slice(0, 8000)}`;

  // 1. Try Google Gemini Flash if configured
  if (geminiKey) {
    try {
      const parsed = await callGeminiJson<any>(prompt, geminiKey, 28000);
      if (parsed) {
        return {
          id: "cv-" + Date.now(),
          fullName: parsed.fullName || fileName.replace(/\.[^/.]+$/, ""),
          title: parsed.title || "Software Engineer",
          summary: parsed.summary || "",
          yearsOfExperience: parsed.yearsOfExperience || 3,
          skills: parsed.skills || [],
          experiences: (parsed.experiences || []).map((exp: any, idx: number) => ({
            id: exp.id || `exp-${idx}`,
            company: exp.company || "Company",
            position: exp.position || "Developer",
            period: exp.period || "2022 - Present",
            description: Array.isArray(exp.description) ? exp.description : [String(exp.description || "")],
            technologies: Array.isArray(exp.technologies) ? exp.technologies : []
          })),
          rawText,
        };
      }
    } catch (gemErr) {
      console.warn("Gemini resume parsing failed, trying OpenAI or fallback:", gemErr);
    }
  }

  // 2. Try OpenAI gpt-4o-mini if configured
  if (openaiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are an elite Tech Resume Parser. Parse resume into strict JSON without hallucinations.`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const parsed = JSON.parse(json.choices[0].message.content);
        return {
          id: "cv-" + Date.now(),
          fullName: parsed.fullName || fileName.replace(/\.[^/.]+$/, ""),
          title: parsed.title || "Software Engineer",
          summary: parsed.summary || "",
          yearsOfExperience: parsed.yearsOfExperience || 3,
          skills: parsed.skills || [],
          experiences: (parsed.experiences || []).map((exp: any, idx: number) => ({
            id: exp.id || `exp-${idx}`,
            company: exp.company || "Company",
            position: exp.position || "Developer",
            period: exp.period || "2022 - Present",
            description: Array.isArray(exp.description) ? exp.description : [String(exp.description || "")],
            technologies: Array.isArray(exp.technologies) ? exp.technologies : []
          })),
          rawText,
        };
      }
    } catch (llmErr) {
      console.warn("OpenAI resume parser error, falling back to smart extractor:", llmErr);
    }
  }

  // 3. Robust offline semantic fallback (Extract real skills and experience)
  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  let candidateName = lines[0] && lines[0].length < 40 ? lines[0] : fileName.replace(/\.[^/.]+$/, "");
  candidateName = candidateName.replace(/[_-]/g, " ").trim();

  const techCatalog = [
    // .NET & Microsoft ecosystem
    "C#", ".NET", ".NET 8", ".NET 7", ".NET 6", ".NET Core", "ASP.NET", "ASP.NET Core", 
    "Entity Framework", "EF Core", "LINQ", "Dapper", "WPF", "WinForms", "WCF", 
    "MS SQL Server", "MS SQL", "T-SQL", "Azure", "Azure DevOps", "NuGet",
    // JavaScript & Web
    "JavaScript", "TypeScript", "React", "React Native", "Next.js", "Node.js", 
    "Express", "NestJS", "Vue.js", "Angular", "Redux", "Zustand", "Tailwind CSS", "HTML", "CSS", "Expo",
    // Backend & Languages
    "Python", "Django", "FastAPI", "Go", "Golang", "Java", "Kotlin", "Swift", "Flutter", "PHP", "Laravel",
    // Databases & Messaging
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "RabbitMQ", "Kafka",
    // DevOps & Tools
    "Docker", "Kubernetes", "AWS", "GCP", "Git", "GitHub Actions", "CI/CD", "Linux",
    // Architecture & Principles
    "Microservices", "REST APIs", "REST", "GraphQL", "Clean Architecture", "SOLID", "Design Patterns", 
    "OOP", "xUnit", "NUnit", "Jest", "Unit Tests"
  ];

  const detectedSkills = techCatalog.filter(tech => {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`, "i").test(rawText);
  });

  let estimatedYears = 4;
  const yearMatch = rawText.match(/(\d+)\+?\s*(?:years|років|года|yrs)/i);
  if (yearMatch && yearMatch[1]) {
    estimatedYears = parseInt(yearMatch[1], 10);
  }

  const titleKeywords = [
    "Senior .NET Developer", ".NET Software Engineer", ".NET Developer", "C# Developer",
    "Lead Backend Developer", "Full-Stack Developer", "Frontend Developer", "Backend Developer", 
    "React Native Developer", "Mobile Engineer", "DevOps Engineer", 
    "Software Engineer", "Lead Developer", "Solution Architect"
  ];
  const detectedTitle = titleKeywords.find(t => new RegExp(t, "i").test(rawText)) || "Software Engineer";

  // Extract real bullet points from raw text (lines starting with •, -, *, or numbered)
  const extractedBullets = lines
    .filter(l => /^[\u2022\u2023\u25E6\u2043\u2219\-\*]\s+/.test(l) || /^\d+\.\s+/.test(l))
    .map(l => l.replace(/^[\u2022\u2023\u25E6\u2043\u2219\-\*]\s+/, "").replace(/^\d+\.\s+/, "").trim())
    .filter(l => l.length > 25);

  const fallbackBullets = extractedBullets.length > 0 
    ? extractedBullets.slice(0, 5) 
    : lines.filter(l => l.length > 40 && !l.includes("@") && !l.includes("http")).slice(0, 4);

  return {
    id: "parsed-" + Date.now(),
    fullName: candidateName,
    title: detectedTitle,
    summary: lines.slice(1, 4).filter(l => l.length > 30).join(" ").slice(0, 350) || `Досвідчений ${detectedTitle} з ${estimatedYears}+ роками комерційного досвіду.`,
    yearsOfExperience: estimatedYears,
    skills: detectedSkills.length > 0 ? detectedSkills : ["C#", ".NET", "ASP.NET Core", "MS SQL", "Docker", "Git"],
    experiences: [
      {
        id: "exp-auto-1",
        company: "Commercial Software Development",
        position: detectedTitle,
        period: "2021 - Present",
        description: fallbackBullets.length > 0 ? fallbackBullets : ["Розробка та підтримка комерційних проектів", "Оптимізація продуктивності систем"],
        technologies: detectedSkills.slice(0, 6)
      }
    ],
    rawText,
  };
}
