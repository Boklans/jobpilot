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
              content: `You are an elite Tech Recruiter & ATS Analyzer. Compare Candidate Profile with Job Description without inventing fake candidate experience.`,
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

  const matchRatio = matched.length / Math.max(matched.length + missing.length, 1);
  const calculatedScore = Math.min(
    Math.max(Math.round(matchRatio * 100 + (profile.yearsOfExperience >= 5 ? 15 : 5)), 45),
    96
  );

  let recommendation: MatchAnalysisResult["recommendation"] = "good_match";
  if (calculatedScore >= 85) recommendation = "strong_match";
  else if (calculatedScore >= 70) recommendation = "good_match";
  else if (calculatedScore >= 50) recommendation = "partial_match";
  else recommendation = "low_match";

  return {
    jobId: job.id,
    profileId: profile.id,
    score: calculatedScore,
    recommendation,
    summary: `Кандидат має сильний профіль для посади ${job.title}. Основний стек збігається, проте варто підкреслити релевантні проєкти під вимоги ${job.company}.`,
    strengths: matched.slice(0, 6).map((s) => `Підтверджений досвід: ${s}`),
    missingSkills: missing.slice(0, 4),
    experienceGaps:
      missing.length > 0
        ? [`Вимоги передбачають знання: ${missing.slice(0, 2).join(", ")}. У CV це прямо не вказано.`]
        : ["Критичних розривів у досвіді не виявлено."],
    tailoringTips: [
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
  analysis: MatchAnalysisResult
): Promise<TailoredCVResult> {
  const openaiKey = process.env.OPENAI_API_KEY;

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
              content: `You are an elite Executive Tech Resume Tailor. Tailor the candidate's existing experience to match the target job description. Never invent fake companies or skills. Return strict JSON:
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
}`,
            },
            {
              role: "user",
              content: JSON.stringify({ candidate: profile, job, analysis }),
            },
          ],
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const parsed = JSON.parse(json.choices[0].message.content);
        return {
          jobId: job.id,
          tailoredSummary: parsed.tailoredSummary,
          highlightedSkills: parsed.highlightedSkills,
          optimizedExperiences: parsed.optimizedExperiences,
          atsKeywordsAdded: parsed.atsKeywordsAdded || [],
        };
      }
    } catch (err) {
      console.warn("Tailored CV OpenAI generation failed, trying Gemini:", err);
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const tailorPrompt = `You are an elite Executive Tech Resume Tailor. Tailor the candidate's existing experience to match the target job description. Never invent fake companies or skills. Return strict JSON:
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

      const parsed = await callGeminiJson<any>(tailorPrompt, geminiKey);
      if (parsed && parsed.tailoredSummary) {
        return {
          jobId: job.id,
          tailoredSummary: parsed.tailoredSummary,
          highlightedSkills: parsed.highlightedSkills || [],
          optimizedExperiences: parsed.optimizedExperiences || [],
          atsKeywordsAdded: parsed.atsKeywordsAdded || [],
        };
      }
    } catch (err) {
      console.warn("Tailored CV Gemini generation failed, using fallback:", err);
    }
  }

  return {
    jobId: job.id,
    tailoredSummary: `Досвідчений ${profile.title} із ${profile.yearsOfExperience}+ роками комерційного досвіду, що спеціалізується на масштабованих рішеннях. Сфокусований на надійній архітектурі, чистій кодовій базі та реалізації вимог для компанії ${job.company}.`,
    highlightedSkills: [
      ...new Set([
        ...profile.skills,
        ...analysis.strengths.map((s) => s.replace("Підтверджений досвід: ", "")),
      ]),
    ].slice(0, 10),
    optimizedExperiences: profile.experiences.map((exp, idx) => ({
      company: exp.company,
      position: exp.position,
      bullets: exp.description.map((bullet) =>
        idx === 0
          ? `[ATS-Optimized] ${bullet} з акцентом на вимоги ${job.company}`
          : bullet
      ),
    })),
    atsKeywordsAdded:
      analysis.missingSkills.length > 0
        ? analysis.missingSkills.slice(0, 3)
        : ["Optimization", "Scalability", "Clean Architecture"],
  };
}

export async function generateCoverLetter(
  profile: CandidateProfile,
  job: JobListing
): Promise<CoverLetterResult> {
  const openaiKey = process.env.OPENAI_API_KEY;

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
              content: `Write a compelling, concise and punchy tech cover letter for this candidate applying to this job. Avoid clichés. Return JSON with fields "subjectLine" and "content".`,
            },
            {
              role: "user",
              content: JSON.stringify({ candidate: profile, job }),
            },
          ],
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const parsed = JSON.parse(json.choices[0].message.content);
        return {
          jobId: job.id,
          subjectLine: parsed.subjectLine,
          content: parsed.content,
        };
      }
    } catch (err) {
      console.warn("Cover Letter OpenAI generation failed, trying Gemini:", err);
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const letterPrompt = `Write a compelling, concise and punchy tech cover letter in Ukrainian (or the language of the job) for this candidate applying to this job. Avoid clichés. Return strict JSON with fields "subjectLine" and "content".
Candidate: ${JSON.stringify(profile)}
Job: ${JSON.stringify(job)}`;

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

  const subjectLine = `Application for ${job.title} — ${profile.fullName}`;
  const content = `Шановна команда ${job.company},

Пишу, щоб висловити зацікавленість у позиції ${job.title}.

Мій практичний досвід (${profile.yearsOfExperience}+ років у сфері ${profile.title}) та стек технологій (${profile.skills.slice(0, 4).join(", ")}) безпосередньо відповідають викликам, описаним у вашій вакансії.

Протягом своєї кар'єри я фокусувався на розробці надійних, масштабованих продуктів та підвищенні швидкодії систем. Мене особливо надихає підхід ${job.company} до побудови рішень, і я готовий принести цінність команді з перших тижнів.

Буду радий коротко поспілкуватися на інтерв'ю та обговорити, як мої навички допоможуть досягти ваших поточних цілей.

З повагою,
${profile.fullName}`;

  return {
    jobId: job.id,
    subjectLine,
    content,
  };
}
