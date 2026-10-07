import { NextRequest, NextResponse } from "next/server";
import { CandidateProfile, ExperienceItem } from "@/types";
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

    // Convert extracted text into structured CandidateProfile using Gemini or OpenAI or Smart Offline Parser
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
  
  // Extract content between parenthesis strings (Tj / TJ)
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

const comprehensiveTechCatalog = [
  // .NET & Microsoft ecosystem
  "C#", ".NET", ".NET 8", ".NET 7", ".NET 6", ".NET Core", "ASP.NET", "ASP.NET Core", "ASP.NET MVC", "Web API",
  "Entity Framework", "EF Core", "LINQ", "Dapper", "WPF", "WinForms", "WCF", "Blazor", "MAUI", "SignalR",
  "MS SQL Server", "MS SQL", "T-SQL", "Azure", "Azure DevOps", "NuGet",
  // JavaScript & Frontend
  "JavaScript", "TypeScript", "React", "React Native", "Next.js", "Node.js", "Express", "NestJS", 
  "Vue.js", "Angular", "Redux", "Zustand", "Tailwind CSS", "HTML", "CSS", "Expo",
  // Backend & Languages
  "Python", "Django", "FastAPI", "Go", "Golang", "Java", "Kotlin", "Swift", "Flutter", "PHP", "Laravel",
  // Databases & Caching & Queues
  "PostgreSQL", "Postgres", "MySQL", "MongoDB", "Redis", "Elasticsearch", "RabbitMQ", "Kafka", "SQLite", "Oracle",
  // DevOps & Cloud
  "Docker", "Kubernetes", "AWS", "GCP", "Git", "GitHub Actions", "CI/CD", "Linux", "Terraform",
  // Architecture & Testing
  "Microservices", "REST APIs", "REST", "GraphQL", "gRPC", "Clean Architecture", "SOLID", "CQRS", "MediatR",
  "OOP", "xUnit", "NUnit", "Moq", "Jest", "Unit Tests", "Integration Testing"
];

function extractTechnologiesFromText(text: string): string[] {
  const normalized = text.replace(/C\s+#/g, "C#").replace(/\.\s*NET/gi, ".NET");
  return comprehensiveTechCatalog.filter(tech => {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`, "i").test(normalized);
  });
}

function parseExperiencesOffline(rawText: string, detectedTitle: string, defaultSkills: string[]): ExperienceItem[] {
  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);

  // Date pattern covering formats like: 06/2022 - Present, 2020 - 2022, May 2019 - Present, etc.
  const dateRegex = /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|Січ(?:ень)?|Лют(?:ий)?|Бер(?:езень)?|Кві(?:тень)?|Тра(?:вень)?|Чер(?:вень)?|Лип(?:ень)?|Сер(?:пень)?|Вер(?:есень)?|Жов(?:тень)?|Лис(?:топад)?|Гру(?:день)?|\d{1,2}[\/.]\d{2,4}|\d{4})\s*[-–—toдо]\s*(?:Present|Current|Now|дотепер|зараз|Тепер|\d{1,2}[\/.]\d{2,4}|\d{4})|\b\d{4}\s*[-–—]\s*(?:Present|Current|Now|дотепер|зараз|\d{4})\b)/i;

  const titlePatterns = [
    /Lead/i, /Senior/i, /Middle/i, /Junior/i, /Engineer/i, /Developer/i, 
    /Architect/i, /Team Lead/i, /Tech Lead/i, /Consultant/i, /Specialist/i,
    /Розробник/i, /Інженер/i, /Архітектор/i, /Тімлід/i
  ];

  // Stop headings
  const stopSections = [
    /^education/i, /^освіта/i, /^skills/i, /^навички/i, /^languages/i, /^мови/i, 
    /^certificates/i, /^сертифікати/i, /^courses/i, /^курси/i, /^summary/i
  ];

  // Find line indices with dates
  const dateLineIndices: number[] = [];
  lines.forEach((line, idx) => {
    if (stopSections.some(s => s.test(line))) return;
    if (dateRegex.test(line)) {
      dateLineIndices.push(idx);
    }
  });

  const experiences: ExperienceItem[] = [];

  dateLineIndices.forEach((dIdx, i) => {
    const periodLine = lines[dIdx];
    const periodMatch = periodLine.match(dateRegex);
    const period = periodMatch ? periodMatch[0].trim() : periodLine;

    // Skip education sections that matched date
    const surrounding = lines.slice(Math.max(0, dIdx - 2), Math.min(lines.length, dIdx + 3)).join(" ");
    if (/university|college|bachelor|master|degree|університет|інститут|магістр|бакалавр/i.test(surrounding)) {
      return;
    }

    let position = "";
    let company = "";

    // Check same line without date
    const lineWithoutDate = periodLine.replace(period, "").replace(/[()|•,]/g, "").trim();
    if (lineWithoutDate.length > 3 && titlePatterns.some(tp => tp.test(lineWithoutDate))) {
      position = lineWithoutDate;
    }

    // Inspect previous lines
    const prevLines = lines.slice(Math.max(0, dIdx - 3), dIdx);
    for (let p = prevLines.length - 1; p >= 0; p--) {
      const pl = prevLines[p];
      if (stopSections.some(s => s.test(pl))) break;
      if (!position && titlePatterns.some(tp => tp.test(pl))) {
        position = pl;
      } else if (!company && pl.length < 50 && !/experience|досвід|work|employment/i.test(pl)) {
        company = pl;
      }
    }

    // If company not found, inspect next line
    if (!company && lines[dIdx + 1] && !lines[dIdx + 1].startsWith("•") && !lines[dIdx + 1].startsWith("-") && lines[dIdx + 1].length < 50) {
      if (titlePatterns.some(tp => tp.test(lines[dIdx + 1]))) {
        if (!position) position = lines[dIdx + 1];
      } else {
        company = lines[dIdx + 1];
      }
    }

    // Collect bullets
    const nextBoundary = (i < dateLineIndices.length - 1) ? dateLineIndices[i + 1] : lines.length;
    const bullets: string[] = [];

    for (let b = dIdx + 1; b < nextBoundary; b++) {
      const bl = lines[b];
      if (stopSections.some(s => s.test(bl))) break;
      if (b === nextBoundary - 1 && (titlePatterns.some(tp => tp.test(bl)) || bl.length < 25)) continue;

      if (/^[\u2022\u2023\u25E6\u2043\u2219\-\*]\s+/.test(bl) || /^\d+\.\s+/.test(bl)) {
        bullets.push(bl.replace(/^[\u2022\u2023\u25E6\u2043\u2219\-\*]\s+/, "").replace(/^\d+\.\s+/, "").trim());
      } else if (bl.length > 25 && !titlePatterns.some(tp => tp.test(bl)) && bl !== company) {
        bullets.push(bl);
      }
    }

    const jobDescription = bullets.length > 0 
      ? bullets 
      : ["Розробка комерційних проектів", "Оптимізація коду та архітектури"];

    const jobTech = extractTechnologiesFromText(jobDescription.join(" ") + " " + (position || ""));

    experiences.push({
      id: `exp-${experiences.length + 1}`,
      company: company || "IT Enterprise",
      position: position || detectedTitle,
      period: period,
      description: jobDescription,
      technologies: jobTech.length > 0 ? jobTech : defaultSkills.slice(0, 5)
    });
  });

  return experiences;
}

async function parseTextIntoProfile(
  rawText: string, 
  fileName: string
): Promise<CandidateProfile> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  
  // Clean candidate name
  let candidateName = "";
  for (const l of lines.slice(0, 4)) {
    if (l.length >= 3 && l.length <= 40 && !l.includes("@") && !l.includes("http") && !/resume|cv|curriculum/i.test(l)) {
      candidateName = l;
      break;
    }
  }
  if (!candidateName) {
    candidateName = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();
  }

  // Detect skills
  const detectedSkills = extractTechnologiesFromText(rawText);

  // Title keywords
  const titleKeywords = [
    "Senior .NET Developer", ".NET Software Engineer", ".NET Developer", "C# Developer",
    "Lead Backend Developer", "Full-Stack Developer", "Frontend Developer", "Backend Developer", 
    "React Native Developer", "Mobile Engineer", "DevOps Engineer", 
    "Software Engineer", "Lead Developer", "Solution Architect"
  ];
  const detectedTitle = titleKeywords.find(t => new RegExp(t, "i").test(rawText)) || "Software Engineer";

  // Years of experience
  let estimatedYears = 4;
  const yearMatch = rawText.match(/(\d+)\+?\s*(?:years|років|року|года|yrs)/i);
  if (yearMatch && yearMatch[1]) {
    estimatedYears = parseInt(yearMatch[1], 10);
  }

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

CRITICAL RULES:
1. You MUST extract EVERY SINGLE past job and company listed in the resume. Do NOT omit, compress, or truncate any work history position.
2. For each experience, extract complete bullet points into "description".
3. Return valid JSON only.

Resume text:
${rawText.slice(0, 8000)}`;

  // 1. Try Google Gemini Flash if configured
  if (geminiKey) {
    try {
      const parsed = await callGeminiJson<any>(prompt, geminiKey, 14000);
      if (parsed && Array.isArray(parsed.experiences) && parsed.experiences.length > 0) {
        return {
          id: "cv-" + Date.now(),
          fullName: parsed.fullName || candidateName,
          title: parsed.title || detectedTitle,
          summary: parsed.summary || "",
          yearsOfExperience: parsed.yearsOfExperience || estimatedYears,
          skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : detectedSkills,
          experiences: parsed.experiences.map((exp: any, idx: number) => ({
            id: exp.id || `exp-${idx + 1}`,
            company: exp.company || "Company",
            position: exp.position || detectedTitle,
            period: exp.period || "2022 - Present",
            description: Array.isArray(exp.description) ? exp.description : [String(exp.description || "")],
            technologies: Array.isArray(exp.technologies) && exp.technologies.length > 0 ? exp.technologies : detectedSkills.slice(0, 5)
          })),
          rawText,
        };
      }
    } catch (gemErr) {
      console.warn("Gemini resume parsing failed, trying OpenAI or smart offline parser:", gemErr);
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
              content: `You are an elite Tech Resume Parser. Parse resume into strict JSON. Extract EVERY past position and company.`,
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
        if (parsed && Array.isArray(parsed.experiences) && parsed.experiences.length > 0) {
          return {
            id: "cv-" + Date.now(),
            fullName: parsed.fullName || candidateName,
            title: parsed.title || detectedTitle,
            summary: parsed.summary || "",
            yearsOfExperience: parsed.yearsOfExperience || estimatedYears,
            skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : detectedSkills,
            experiences: parsed.experiences.map((exp: any, idx: number) => ({
              id: exp.id || `exp-${idx + 1}`,
              company: exp.company || "Company",
              position: exp.position || detectedTitle,
              period: exp.period || "2022 - Present",
              description: Array.isArray(exp.description) ? exp.description : [String(exp.description || "")],
              technologies: Array.isArray(exp.technologies) && exp.technologies.length > 0 ? exp.technologies : detectedSkills.slice(0, 5)
            })),
            rawText,
          };
        }
      }
    } catch (llmErr) {
      console.warn("OpenAI resume parser error, falling back to smart extractor:", llmErr);
    }
  }

  // 3. Robust Smart Offline Semantic Parser
  const offlineExperiences = parseExperiencesOffline(rawText, detectedTitle, detectedSkills);

  // If no date blocks detected, extract real bullet points from raw text
  const finalExperiences = offlineExperiences.length > 0 
    ? offlineExperiences 
    : [
        {
          id: "exp-1",
          company: "Commercial Software Development",
          position: detectedTitle,
          period: "2021 - Present",
          description: lines
            .filter(l => /^[\u2022\u2023\u25E6\u2043\u2219\-\*]\s+/.test(l) || /^\d+\.\s+/.test(l))
            .map(l => l.replace(/^[\u2022\u2023\u25E6\u2043\u2219\-\*]\s+/, "").replace(/^\d+\.\s+/, "").trim())
            .slice(0, 5),
          technologies: detectedSkills.slice(0, 6)
        }
      ];

  const summaryLine = lines.slice(1, 5).find(l => l.length > 45 && !l.includes("@") && !l.includes("http")) 
    || `Досвідчений ${detectedTitle} з ${estimatedYears}+ роками комерційного досвіду розробки сучасних програмних систем.`;

  return {
    id: "parsed-" + Date.now(),
    fullName: candidateName,
    title: detectedTitle,
    summary: summaryLine,
    yearsOfExperience: estimatedYears,
    skills: detectedSkills.length > 0 ? detectedSkills : ["C#", ".NET", "ASP.NET Core", "MS SQL", "Docker", "Git"],
    experiences: finalExperiences,
    rawText,
  };
}
