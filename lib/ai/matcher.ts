import { CandidateProfile, JobListing, MatchAnalysisResult, TailoredCVResult, CoverLetterResult } from "@/types";
import { callGeminiJson } from "@/lib/ai/gemini";

/**
 * Intelligent Match Analyzer
 * Supports real LLM call (OpenAI or Google Gemini) if API key provided,
 * or falls back to robust semantic heuristics for testing.
 */
export async function analyzeJobMatch(
  profile: CandidateProfile,
  job: JobListing
): Promise<MatchAnalysisResult> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const prompt = `Candidate Profile:
Name: ${profile.fullName}
Title: ${profile.title}
Experience: ${profile.yearsOfExperience} years
Skills: ${profile.skills.join(", ")}
Summary: ${profile.summary}

Job Listing:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description:
${job.rawDescription}

CRITICAL MATCH SCORING RULES:
1. PRIMARY TECH STACK ALIGNMENT IS PARAMOUNT:
- Determine the primary core programming language & framework required by the Job Title and Description (e.g. Node.js, Angular, React, Vue, Python, Java, .NET/C#, PHP, Go, etc.).
- If the candidate's background is in a fundamentally different primary stack (for example, a .NET/C# engineer applying for a Senior Full-Stack Angular/Node.js job, or a Java developer applying for a Python/Django role):
  * The score MUST be between 15 and 35.
  * The recommendation MUST be "low_match".
  * DO NOT inflate the score based on generic software engineering overlaps (such as Git, Docker, SQL, Agile, OOP, Microservices, or Seniority).
  * In summary and experienceGaps, explicitly state: "Критична невідповідність основного стеку: Вакансія вимагає [Job Stack], тоді як профіль кандидата сфокусований на [Candidate Stack]."
2. High Match (80-100%) requires direct compatibility with the primary languages and frameworks.
3. Partial Match (50-75%) is ONLY for roles within the same or closely related ecosystem.

Return strict JSON:
{
  "score": number (0-100),
  "recommendation": "strong_match" | "good_match" | "partial_match" | "low_match",
  "summary": string,
  "strengths": string[],
  "missingSkills": string[],
  "experienceGaps": string[],
  "tailoringTips": string[],
  "interviewTips": string[]
}`;

  // Try OpenAI
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
              content: `You are an elite Tech Recruiter & ATS Analyzer. Strictly evaluate primary stack compatibility. Do not invent fake candidate experience.`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        return {
          jobId: job.id,
          profileId: profile.id,
          score: parsed.score || 80,
          recommendation: parsed.recommendation || "good_match",
          summary: parsed.summary || "",
          strengths: parsed.strengths || [],
          missingSkills: parsed.missingSkills || [],
          experienceGaps: parsed.experienceGaps || [],
          tailoringTips: parsed.tailoringTips || [],
          interviewTips: parsed.interviewTips || [],
          calculatedAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn("OpenAI API call failed, trying fallback:", err);
    }
  }

  // Try Gemini
  if (geminiKey) {
    try {
      const parsed = await callGeminiJson<any>(prompt, geminiKey);
      if (parsed) {
        return {
          jobId: job.id,
          profileId: profile.id,
          score: parsed.score || 80,
          recommendation: parsed.recommendation || "good_match",
          summary: parsed.summary || "",
          strengths: parsed.strengths || [],
          missingSkills: parsed.missingSkills || [],
          experienceGaps: parsed.experienceGaps || [],
          tailoringTips: parsed.tailoringTips || [],
          interviewTips: parsed.interviewTips || [],
          calculatedAt: new Date().toISOString(),
        };
      }
    } catch (geminiErr) {
      console.warn("Gemini API call failed, trying fallback:", geminiErr);
    }
  }

  // Fallback intelligent analyzer (for instant demo / offline test)
  const jobTextLower = job.rawDescription.toLowerCase() + " " + job.title.toLowerCase();
  const cvSkills = profile.skills.map((s) => s.toLowerCase());
  const cvText = (profile.skills.join(" ") + " " + profile.title + " " + profile.summary).toLowerCase();

  // Core Tech Ecosystem detection
  const STACK_GROUPS: { name: string; keywords: string[] }[] = [
    { name: "Node.js", keywords: ["node.js", "nodejs", "express", "nestjs"] },
    { name: "Angular", keywords: ["angular", "angularjs", "rxjs"] },
    { name: "React", keywords: ["react", "react.js", "next.js"] },
    { name: "Vue", keywords: ["vue", "vue.js", "nuxt"] },
    { name: ".NET / C#", keywords: ["c#", ".net", "dotnet", "asp.net", "ef core"] },
    { name: "Java", keywords: ["java", "spring", "spring boot"] },
    { name: "Python", keywords: ["python", "django", "fastapi", "flask"] },
    { name: "PHP", keywords: ["php", "laravel", "symfony"] },
    { name: "Go", keywords: ["golang", "go language"] },
    { name: "Mobile", keywords: ["swift", "ios", "kotlin", "android", "flutter"] },
    { name: "QA", keywords: ["qa", "quality assurance", "test automation", "selenium", "playwright"] },
  ];

  // Check required core stacks in job title and description
  const requiredCoreStacks = STACK_GROUPS.filter((group) =>
    group.keywords.some((kw) => job.title.toLowerCase().includes(kw) || jobTextLower.includes(kw))
  );

  const matchedCoreStacks = requiredCoreStacks.filter((group) =>
    group.keywords.some((kw) => cvText.includes(kw))
  );

  const missingCoreStacks = requiredCoreStacks.filter(
    (group) => !matchedCoreStacks.includes(group)
  );

  // If job demands specific core stacks (e.g. Angular, Node.js) and candidate has NONE of them:
  const isSevereStackMismatch =
    requiredCoreStacks.length > 0 &&
    matchedCoreStacks.length === 0 &&
    missingCoreStacks.length > 0;

  // Detect matching skills
  const matched = profile.skills.filter((s) => jobTextLower.includes(s.toLowerCase()));

  // Detect potential missing keywords often found in jobs
  const commonKeywords = [
    "aws", "docker", "kubernetes", "graphql", "ci/cd", "microservices",
    "system design", "tailwind", "redis", "postgresql", "next.js", "unit tests",
    "agile", "jest", "react native", "typescript", "performance optimization"
  ];

  const missing = commonKeywords.filter(
    (kw) => jobTextLower.includes(kw) && !cvSkills.some((s) => s.includes(kw))
  );

  // Add missing core stack names to missing list
  missingCoreStacks.forEach((stack) => {
    if (!missing.includes(stack.name)) {
      missing.unshift(stack.name);
    }
  });

  let calculatedScore: number;
  let recommendation: MatchAnalysisResult["recommendation"];
  let summaryText: string;
  let experienceGaps: string[];

  if (isSevereStackMismatch) {
    // Critical stack mismatch (e.g. .NET dev applying for Angular/Node.js)
    calculatedScore = Math.floor(Math.random() * 8) + 20; // 20 - 27%
    recommendation = "low_match";
    const reqNames = missingCoreStacks.map((s) => s.name).join(", ");
    summaryText = `Критична невідповідність основного технологічного стеку: Вакансія вимагає спеціалізацію у ${reqNames}, тоді як ваш профіль сфокусований на ${profile.title}. Навіть за наявності сильних загальних навичок архітектури та DevOps, проходження первинного технічного відбору малоймовірне.`;
    experienceGaps = [
      `Вакансія вимагає комерційний досвід у ${reqNames}. У вашому CV цей стек відсутній.`,
      `Профіль кандидата (${profile.title}) не відповідає основному напрямку позиції (${job.title}).`
    ];
  } else {
    const matchRatio = matched.length / Math.max(matched.length + missing.length, 1);
    calculatedScore = Math.min(
      Math.max(Math.round(matchRatio * 100 + (profile.yearsOfExperience >= 5 ? 15 : 5)), 45),
      96
    );

    if (calculatedScore >= 85) recommendation = "strong_match";
    else if (calculatedScore >= 70) recommendation = "good_match";
    else if (calculatedScore >= 50) recommendation = "partial_match";
    else recommendation = "low_match";

    summaryText = `Кандидат має гарний профіль для посади ${job.title}. Основний стек збігається, проте варто підкреслити релевантні проєкти під вимоги ${job.company}.`;
    experienceGaps =
      missing.length > 0
        ? [`Вимоги передбачають знання: ${missing.slice(0, 2).join(", ")}. У CV це прямо не вказано.`]
        : ["Критичних розривів у досвіді не виявлено."];
  }

  return {
    jobId: job.id,
    profileId: profile.id,
    score: calculatedScore,
    recommendation,
    summary: summaryText,
    strengths: matched.slice(0, 6).map((s) => `Підтверджений досвід: ${s}`),
    missingSkills: missing.slice(0, 5),
    experienceGaps,
    tailoringTips: isSevereStackMismatch
      ? [
          `Вакансія вимагає інший стек (${missingCoreStacks.map((s) => s.name).join(", ")}). Рекомендується шукати позиції під ваш профіль ${profile.title}.`,
          `Якщо у вас є пет-проєкти або комерційний досвід з ${missingCoreStacks.map((s) => s.name).join(", ")}, обов'язково додайте їх до профілю.`,
        ]
      : [
          `Підняти нагору блок Summary з фокусом на ${job.title}`,
          `Підкреслити конкретні метрики та результати у найбільш релевантних проєктах`,
          `Узгодити термінологію (ATS Keywords) з оригінальним описом вакансії`,
        ],
    interviewTips: [
      `Будьте готові до питань про архітектуру та вибір технологічного стеку`,
      `Підготуйте приклади вирішення складних технічних проблем або оптимізації швидкодії`,
    ],
    calculatedAt: new Date().toISOString(),
  };
}

export async function generateTailoredCV(
  profile: CandidateProfile,
  job: JobListing,
  analysis: MatchAnalysisResult,
  language: "ua" | "en" = "en"
): Promise<TailoredCVResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const isEn = language === "en";

  const tailorPrompt = `You are an elite Executive Tech Resume Tailor. Tailor the candidate's existing experience to match the target job description. Never invent fake companies or skills.
LANGUAGE: Write strictly in ${isEn ? "English" : "Ukrainian"}.
CRITICAL RULES FOR HR-READY RESUME:
1. NEVER include meta-labels such as "[ATS-Optimized]", "Targeted for", "з акцентом на вимоги", or the hiring company's name (${job.company}) inside past job bullets or summary! This resume is submitted directly to the HR and hiring managers of ${job.company} and MUST read as an authentic, natural, high-impact professional resume.
2. Emphasize actual engineering achievements, architecture, scale, and relevant stack (${profile.skills.slice(0, 8).join(", ")}).
3. Keep bullets action-driven with strong verbs.

Return strict JSON:
{
  "tailoredSummary": string,
  "highlightedSkills": string[],
  "optimizedExperiences": [
    {
      "company": string,
      "position": string,
      "bullets": string[]
    }
  ],
  "atsKeywordsAdded": string[]
}

Candidate: ${JSON.stringify(profile)}
Job: ${JSON.stringify(job)}
Analysis: ${JSON.stringify(analysis)}`;

  if (geminiKey) {
    try {
      const parsed = await callGeminiJson<any>(tailorPrompt, geminiKey);
      if (parsed && parsed.tailoredSummary) {
        return {
          jobId: job.id,
          tailoredSummary: parsed.tailoredSummary,
          highlightedSkills: parsed.highlightedSkills || [],
          optimizedExperiences: (parsed.optimizedExperiences || []).map((exp: any, idx: number) => {
            const orig = profile.experiences.find((e) => e.company.toLowerCase() === (exp.company || "").toLowerCase()) || profile.experiences[idx];
            return {
              company: exp.company || orig?.company || "Company",
              position: exp.position || orig?.position || "Developer",
              period: exp.period || orig?.period || "2022 - Present",
              bullets: (exp.bullets || []).map((b: string) =>
                b.replace(/\[ATS-Optimized\]\s*/gi, "").replace(/з акцентом на вимоги\s+[A-Za-z0-9_-]+/gi, "").trim()
              ),
            };
          }),
          atsKeywordsAdded: parsed.atsKeywordsAdded || [],
        };
      }
    } catch (err) {
      console.warn("Tailored CV Gemini generation failed, using fallback:", err);
    }
  }

  return {
    jobId: job.id,
    tailoredSummary: isEn
      ? `Accomplished ${profile.title} with ${profile.yearsOfExperience}+ years of production experience building high-scale distributed systems. Focused on resilient architecture, clean code practices, and high-throughput backend services.`
      : `Досвідчений ${profile.title} із ${profile.yearsOfExperience}+ роками комерційного досвіду в розробці високонавантажених сервісів. Сфокусований на надійній архітектурі, чистій кодовій базі та високій продуктивності систем.`,
    highlightedSkills: [
      ...new Set([
        ...profile.skills,
        ...analysis.strengths.map((s) => s.replace("Підтверджений досвід: ", "")),
      ]),
    ].slice(0, 10),
    optimizedExperiences: profile.experiences.map((exp) => ({
      company: exp.company,
      position: exp.position,
      period: exp.period,
      bullets: exp.description.map((bullet) =>
        bullet.replace(/\[ATS-Optimized\]\s*/gi, "").replace(/з акцентом на вимоги\s+[A-Za-z0-9_-]+/gi, "").trim()
      ),
    })),
    atsKeywordsAdded:
      analysis.missingSkills.length > 0
        ? analysis.missingSkills.slice(0, 3)
        : ["Clean Architecture", "Performance Optimization", "High Scalability"],
  };
}

export async function generateCoverLetter(
  profile: CandidateProfile,
  job: JobListing,
  language: "ua" | "en" = "en"
): Promise<CoverLetterResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const isEn = language === "en";

  const letterPrompt = `Write a compelling, concise and punchy tech cover letter for this candidate applying to this job.
LANGUAGE: Write strictly in ${isEn ? "English" : "Ukrainian"}.
Tone: Professional, direct, confident, and free of clichés.
Return strict JSON with fields "subjectLine" and "content".
Candidate: ${JSON.stringify(profile)}
Job: ${JSON.stringify(job)}`;

  if (geminiKey) {
    try {
      const parsed = await callGeminiJson<any>(letterPrompt, geminiKey);
      if (parsed && parsed.subjectLine && parsed.content) {
        return {
          jobId: job.id,
          subjectLine: parsed.subjectLine,
          content: parsed.content,
        };
      }
    } catch (err) {
      console.warn("Cover Letter Gemini generation failed, using fallback:", err);
    }
  }

  if (isEn) {
    return {
      jobId: job.id,
      subjectLine: `Application for ${job.title} — ${profile.fullName}`,
      content: `Dear Hiring Team at ${job.company},

I am writing to express my strong interest in the ${job.title} position.

With ${profile.yearsOfExperience}+ years of commercial experience as a ${profile.title} and strong expertise across ${profile.skills.slice(0, 5).join(", ")}, my technical background closely aligns with the requirements of this role.

Throughout my career, I have focused on designing robust, high-scale solutions and improving system performance. I would welcome the opportunity to discuss how my skill set can support ${job.company}'s current goals.

Best regards,
${profile.fullName}`,
    };
  }

  return {
    jobId: job.id,
    subjectLine: `Відгук на вакансію ${job.title} — ${profile.fullName}`,
    content: `Шановна команда ${job.company},

Пишу, щоб висловити зацікавленість у позиції ${job.title}.

Мій практичний досвід (${profile.yearsOfExperience}+ років у сфері ${profile.title}) та стек технологій (${profile.skills.slice(0, 5).join(", ")}) безпосередньо відповідають викликам, описаним у вашій вакансії.

Протягом своєї кар'єри я фокусувався на розробці надійних, масштабованих продуктів та оптимізації швидкодії систем. Буду радий обговорити на інтерв'ю, як мій практичний досвід допоможе реалізувати поточні цілі команди ${job.company}.

З повагою,
${profile.fullName}`,
  };
}
