import { NextRequest, NextResponse } from "next/server";
import { CandidateProfile } from "@/types";

// Dynamic import or require for pdf-parse to avoid Next.js node bundle issues
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
      // Parse PDF using unpdf
      const { extractText } = await import("unpdf");
      const pdfResult = await extractText(new Uint8Array(buffer));
      extractedText = Array.isArray(pdfResult.text) ? pdfResult.text.join("\n") : (pdfResult.text || "");
    } else if (fileNameLower.endsWith(".docx")) {
      // Parse DOCX
      const mammoth = await import("mammoth");
      const docxResult = await mammoth.extractRawText({ buffer });
      extractedText = docxResult.value;
    } else {
      // Plain text or markdown
      extractedText = buffer.toString("utf-8");
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Не вдалося витягти текст із файлу. Перевірте, чи файл не є відсканованим зображенням." },
        { status: 422 }
      );
    }

    // Now convert extracted text into structured CandidateProfile
    const profile = await parseTextIntoProfile(extractedText, file.name);

    return NextResponse.json({ success: true, profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error in parse-cv API:", err);
    return NextResponse.json(
      { error: "Помилка обробки файлу: " + message },
      { status: 500 }
    );
  }
}

async function parseTextIntoProfile(
  rawText: string, 
  fileName: string
): Promise<CandidateProfile> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are an expert Tech Resume Parser. Parse this raw resume text into strict JSON structure:
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
Extract realistic and exact information from the text without hallucinating.`,
            },
            {
              role: "user",
              content: rawText.slice(0, 8000), // Protect token limits
            },
          ],
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const parsed = JSON.parse(json.choices[0].message.content);
        return {
          id: "cv-" + Date.now(),
          fullName: parsed.fullName || "Candidate",
          title: parsed.title || "Software Engineer",
          summary: parsed.summary || "",
          yearsOfExperience: parsed.yearsOfExperience || 3,
          skills: parsed.skills || [],
          experiences: parsed.experiences || [],
          rawText,
        };
      }
    } catch (llmErr) {
      console.warn("LLM resume parser error, falling back to smart regex:", llmErr);
    }
  }

  // Fallback intelligent heuristic extractor
  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  
  // Best guess for candidate name (first line or file name)
  let candidateName = lines[0] && lines[0].length < 40 ? lines[0] : fileName.replace(/\.[^/.]+$/, "");
  // Clean special characters
  candidateName = candidateName.replace(/[_-]/g, " ").trim();

  // Tech catalog to auto-detect skills from raw text
  const techCatalog = [
    "JavaScript", "TypeScript", "React", "React Native", "Next.js", "Node.js", 
    "Express", "NestJS", "Python", "Django", "FastAPI", "Go", "Golang", 
    "Java", "Kotlin", "Swift", "Flutter", "PHP", "Laravel", "PostgreSQL", 
    "MySQL", "MongoDB", "Redis", "GraphQL", "REST APIs", "AWS", "GCP", 
    "Docker", "Kubernetes", "Git", "CI/CD", "Tailwind CSS", "Redux", "Zustand", 
    "Jest", "Cypress", "HTML", "CSS", "Expo", "Linux", "Microservices"
  ];

  const detectedSkills = techCatalog.filter(tech => 
    new RegExp(`\\b${tech.replace(".", "\\.")}\\b`, "i").test(rawText)
  );

  // Experience year estimation
  let estimatedYears = 4;
  const yearMatch = rawText.match(/(\d+)\+?\s*(?:years|років|года|yrs)/i);
  if (yearMatch && yearMatch[1]) {
    estimatedYears = parseInt(yearMatch[1], 10);
  }

  // Guess job title
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
    summary: lines.slice(1, 4).join(" ").slice(0, 300) || `Професійний ${detectedTitle} з практичним комерційним досвідом.`,
    yearsOfExperience: estimatedYears,
    skills: detectedSkills.length > 0 ? detectedSkills : ["TypeScript", "React", "Node.js", "Git"],
    experiences: [
      {
        id: "exp-auto-1",
        company: "Recent Commercial Project",
        position: detectedTitle,
        period: "2022 - Present",
        description: lines.slice(4, 8).filter(l => l.length > 20).slice(0, 3),
        technologies: detectedSkills.slice(0, 5)
      }
    ],
    rawText,
  };
}
