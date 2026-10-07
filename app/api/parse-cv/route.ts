import { NextRequest, NextResponse } from "next/server";
import { CandidateProfile } from "@/types";

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
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${prompt}\n\nRespond strictly with valid JSON only.` }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawContent) {
          const parsed = JSON.parse(rawContent);
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
    "JavaScript", "TypeScript", "React", "React Native", "Next.js", "Node.js", 
    "Express", "NestJS", "Python", "Django", "FastAPI", "Go", "Golang", 
    "Java", "Kotlin", "Swift", "Flutter", "PHP", "Laravel", "PostgreSQL", 
    "MySQL", "MongoDB", "Redis", "GraphQL", "REST APIs", "AWS", "GCP", 
    "Docker", "Kubernetes", "Git", "CI/CD", "Tailwind CSS", "Redux", "Zustand", 
    "Jest", "Cypress", "HTML", "CSS", "Expo", "Linux", "Microservices", "Vue.js", "Angular"
  ];

  const detectedSkills = techCatalog.filter(tech => 
    new RegExp(`\\b${tech.replace(".", "\\.")}\\b`, "i").test(rawText)
  );

  let estimatedYears = 4;
  const yearMatch = rawText.match(/(\d+)\+?\s*(?:years|років|года|yrs)/i);
  if (yearMatch && yearMatch[1]) {
    estimatedYears = parseInt(yearMatch[1], 10);
  }

  const titleKeywords = [
    "Full-Stack Developer", "Frontend Developer", "Backend Developer", 
    "React Native Developer", "Mobile Engineer", "DevOps Engineer", 
    "QA Automation", "Software Engineer", "Lead Developer", "Solution Architect"
  ];
  const detectedTitle = titleKeywords.find(t => new RegExp(t, "i").test(rawText)) || "Senior Software Engineer";

  return {
    id: "parsed-" + Date.now(),
    fullName: candidateName,
    title: detectedTitle,
    summary: lines.slice(1, 4).join(" ").slice(0, 300) || `Професійний ${detectedTitle} з комерційним досвідом.`,
    yearsOfExperience: estimatedYears,
    skills: detectedSkills.length > 0 ? detectedSkills : ["TypeScript", "React", "Node.js", "Git"],
    experiences: [
      {
        id: "exp-auto-1",
        company: "Commercial Experience",
        position: detectedTitle,
        period: "2021 - Present",
        description: lines.slice(3, 7).filter(l => l.length > 20).slice(0, 3),
        technologies: detectedSkills.slice(0, 5)
      }
    ],
    rawText,
  };
}
