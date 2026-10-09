import { 
  CandidateProfile, 
  JobListing, 
  MatchAnalysisResult, 
  TailoredCVResult, 
  CoverLetterResult, 
  CoverLetterLength, 
  InterviewQuestionItem,
  SalaryInsightResult,
  OutreachKitResult
} from "@/types";
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

CRITICAL MATCH SCORING & CONSISTENCY RULES:
1. PRIMARY TECH STACK ALIGNMENT IS PARAMOUNT:
- Determine the primary core programming language & framework required by the Job Title and Description (e.g. Node.js, Angular, React, Vue, Python, Java, .NET/C#, PHP, Go, etc.).
- If the candidate's background is in a fundamentally different primary stack (for example, a .NET/C# engineer applying for a Senior Full-Stack Angular/Node.js job, or a Java developer applying for a Python/Django role):
  * The score MUST be between 15 and 35.
  * The recommendation MUST be "low_match".
  * DO NOT inflate the score based on generic software engineering overlaps.
  * In summary and experienceGaps, explicitly state: "Критична невідповідність основного стеку: Вакансія вимагає [Job Stack], тоді як профіль кандидата сфокусований на [Candidate Stack]."
2. GROUNDED PENALTIES FOR MISSING REQUIREMENTS:
- If the core language matches, but the candidate lacks stated critical architectural/infrastructure requirements (such as Kubernetes, Microservices, Cloud, Docker, System Design, or specified Database engines):
  * Apply a penalty of -10 to -15 points per critical missing requirement.
  * A candidate CANNOT receive "strong_match" (>=85%) if they lack 2 or more critical stated requirements!
  * If 2+ critical requirements are missing, score MUST be capped at 74% ("good_match" or "partial_match").
  * If 1 critical requirement is missing, score MUST be capped at 82%.
3. STRICT ALIGNMENT BETWEEN SCORE, VERDICT & GAPS:
- The score and recommendation MUST NEVER contradict the listed missingSkills or experienceGaps.
- "strong_match" (85-100%): direct alignment across core & architectural requirements with NO critical gaps.
- "good_match" (70-84%): strong primary alignment, but with 1 notable gap to address.
- "partial_match" (50-69%): 2+ notable missing technologies or seniority gap.
- "low_match" (<50%): severe stack mismatch or missing fundamental prerequisites.

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

  // Helper to ensure consistency clamp between score and gaps
  const enforceConsistency = (score: number, missing: string[], gaps: string[], rec: MatchAnalysisResult["recommendation"]) => {
    let finalScore = score;
    const hasCriticalGaps = gaps.length >= 2 || missing.length >= 3;
    if (hasCriticalGaps && finalScore >= 85) {
      finalScore = 78;
    }
    let finalRec = rec;
    if (finalScore >= 85) finalRec = "strong_match";
    else if (finalScore >= 70) finalRec = "good_match";
    else if (finalScore >= 50) finalRec = "partial_match";
    else finalRec = "low_match";

    return { score: finalScore, recommendation: finalRec };
  };

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
        const { score, recommendation } = enforceConsistency(
          parsed.score || 70,
          parsed.missingSkills || [],
          parsed.experienceGaps || [],
          parsed.recommendation || "good_match"
        );

        return {
          jobId: job.id,
          profileId: profile.id,
          score,
          recommendation,
          summary: parsed.summary || "",
          strengths: parsed.strengths || [],
          missingSkills: parsed.missingSkills || [],
          experienceGaps: parsed.experienceGaps || [],
          tailoringTips: parsed.tailoringTips || [],
          interviewTips: parsed.interviewTips || [],
          interviewQuestions: parsed.interviewQuestions || generateInterviewQuestions(profile, job),
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
        const { score, recommendation } = enforceConsistency(
          parsed.score || 70,
          parsed.missingSkills || [],
          parsed.experienceGaps || [],
          parsed.recommendation || "good_match"
        );

        return {
          jobId: job.id,
          profileId: profile.id,
          score,
          recommendation,
          summary: parsed.summary || "",
          strengths: parsed.strengths || [],
          missingSkills: parsed.missingSkills || [],
          experienceGaps: parsed.experienceGaps || [],
          tailoringTips: parsed.tailoringTips || [],
          interviewTips: parsed.interviewTips || [],
          interviewQuestions: parsed.interviewQuestions || generateInterviewQuestions(profile, job),
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
    // 1. Core skill overlap (up to 60 points)
    const matchRatio = matched.length / Math.max(matched.length + missing.length, 1);
    const skillScore = Math.round(matchRatio * 60);

    // 2. Seniority & track record (up to 20 points)
    const seniorityScore = profile.yearsOfExperience >= 7 ? 20 : profile.yearsOfExperience >= 4 ? 15 : 10;

    // 3. Domain alignment (up to 15 points)
    const domainScore = matchedCoreStacks.length > 0 ? 15 : 5;

    const rawScore = skillScore + seniorityScore + domainScore;

    // 4. Critical Penalty for missing architectural/cloud requirements:
    const criticalKeywords = ["kubernetes", "microservices", "aws", "docker", "system design", "ci/cd"];
    const criticalMissing = missing.filter((kw) => criticalKeywords.includes(kw.toLowerCase()));
    const otherMissing = missing.filter((kw) => !criticalKeywords.includes(kw.toLowerCase()));

    // Each critical missing requirement penalizes -10 points, non-critical -4 points
    const penalty = criticalMissing.length * 10 + otherMissing.length * 4;

    calculatedScore = Math.max(30, Math.min(95, rawScore - penalty));

    // Consistency clamp: If there are 2+ critical gaps or 4+ total missing skills, score CANNOT be >= 85
    if (criticalMissing.length >= 2 || missing.length >= 4) {
      calculatedScore = Math.min(calculatedScore, 74);
    } else if (criticalMissing.length === 1) {
      calculatedScore = Math.min(calculatedScore, 82);
    }

    if (calculatedScore >= 85) recommendation = "strong_match";
    else if (calculatedScore >= 70) recommendation = "good_match";
    else if (calculatedScore >= 50) recommendation = "partial_match";
    else recommendation = "low_match";

    summaryText = calculatedScore >= 85
      ? `Висока сумісність: кандидат володіє ключовим стеком (${matched.slice(0, 3).join(", ")}) та відповідає основним інженерним вимогам для ${job.title}.`
      : calculatedScore >= 70
      ? `Хороша сумісність з окремими зонами росту: основний стек збігається, проте у вакансії зазначені вимоги (${missing.slice(0, 2).join(", ")}), відсутні у поточному резюме.`
      : `Помірна сумісність: виявлено помітні розриви у необхідних технологіях (${missing.slice(0, 3).join(", ")}), що може стати ризиком на первинному скринінгу.`;

    experienceGaps =
      missing.length > 0
        ? [
            `Вимоги передбачають знання: ${missing.slice(0, 3).join(", ")}. У CV це прямо не підтверджено.`,
            criticalMissing.length > 0 ? `Критичний ризик для скринінгу: відсутність ${criticalMissing.join(", ")}.` : undefined,
          ].filter(Boolean) as string[]
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
    interviewQuestions: generateInterviewQuestions(profile, job),
    calculatedAt: new Date().toISOString(),
  };
}

export function generateInterviewQuestions(
  profile: CandidateProfile,
  job: JobListing,
  isEn: boolean = false
): InterviewQuestionItem[] {
  const jobTextLower = (job.rawDescription + " " + job.title + " " + job.company).toLowerCase();

  const isFintech = /bank|fintech|financial|payment|transaction|фінанс|платіж|банк|кредит|lime|privat/i.test(jobTextLower);
  const isCloudDevOps = /aws|azure|cloud|docker|kubernetes|k8s|ci\/cd|devops|terraform|microservice|хмар/i.test(jobTextLower);

  if (isFintech) {
    if (isEn) {
      return [
        {
          id: "iq-fin-1",
          category: "architecture",
          question: "How do you guarantee strict transaction consistency (ACID) and idempotency across high-throughput payment pipelines?",
          context: `${job.company} operates financial transaction workflows where duplicate charges or dirty reads are catastrophic.`,
          talkingPoints: [
            "Explain transaction isolation levels (Read Committed Snapshot, Serializable) and concurrency trade-offs.",
            "Discuss Idempotency Keys stored with distributed locks (Redis/PostgreSQL) to avoid duplicate payments.",
            "Mention Transaction Outbox Pattern for reliable event publishing without two-phase commit."
          ]
        },
        {
          id: "iq-fin-2",
          category: "deep_tech",
          question: "What systematic methodology do you use to diagnose and eliminate query execution bottlenecks and deadlocks?",
          context: `Financial ledgers experience heavy concurrent updates leading to table contention and lock escalation.`,
          talkingPoints: [
            "Profiling using EXPLAIN ANALYZE or SQL Server Execution Plans to detect full table scans and implicit conversions.",
            "Designing targeted non-clustered composite indexes with INCLUDE columns.",
            "Optimistic concurrency control with row versioning (timestamp/rowversion) to avoid pessimistic locking."
          ]
        },
        {
          id: "iq-fin-3",
          category: "domain",
          question: "How do you structure data validation and audit logging for sensitive financial operations?",
          context: `Banking and FinTech systems must comply with strict auditability and regulatory traceability.`,
          talkingPoints: [
            "Immutable append-only audit event tables tracking exact before/after states.",
            "FluentValidation and business invariant checks inside domain entities before persisting.",
            "Masking PII and financial card data in logs and telemetry."
          ]
        }
      ];
    } else {
      return [
        {
          id: "iq-fin-1",
          category: "architecture",
          question: "Як ви гарантуєте сувору транзакційну цілісність (ACID) та ідемпотентність у високонавантажених платіжних процесах?",
          context: `${job.company} працює з фінансовими транзакціями, де подвійне списання чи брудне читання неприпустимі.`,
          talkingPoints: [
            "Рівні ізоляції транзакцій (Read Committed Snapshot, Serializable) та баланс між продуктивністю й безпекою.",
            "Реалізація ідемпотентних ключів (Idempotency Key) з розподіленим блокуванням (Redis/SQL).",
            "Transaction Outbox Pattern для надійної синхронізації бази даних та брокера повідомлень."
          ]
        },
        {
          id: "iq-fin-2",
          category: "deep_tech",
          question: "Який ваш підхід до діагностики та усунення блокувань (Deadlocks) і повільних планів виконання SQL?",
          context: `Фінансові реєстри мають високу конкурентність одночасних операцій, що часто спричиняє deadlock.`,
          talkingPoints: [
            "Аналіз планів виконання (Execution Plans, DMV) для виявлення Table Scan та відсутніх індексів.",
            "Проектування non-clustered індексів із секцією INCLUDE для покриття запитів (Covering Index).",
            "Оптимістичне блокування (Optimistic Concurrency) через RowVersion замість блокуючих транзакцій."
          ]
        },
        {
          id: "iq-fin-3",
          category: "domain",
          question: "Як організувати аудит та незмінність історії змін (Audit Trail) критичних фінансових операцій?",
          context: `Банківські регулятори та безпека вимагають 100% простежуваності кожного запису.`,
          talkingPoints: [
            "Незмінні (Immutable) append-only таблиці аудиту для фіксації кожного кроку транзакції.",
            "Валідація бізнес-правил всередині Domain Model (DDD) перед збереженням у БД.",
            "Маскування чутливих даних (PII) у логах та системах моніторингу."
          ]
        }
      ];
    }
  }

  if (isCloudDevOps) {
    if (isEn) {
      return [
        {
          id: "iq-cld-1",
          category: "architecture",
          question: "How do you design decoupled microservices to prevent cascading failures during service downtime?",
          context: `${job.company} builds distributed cloud services requiring high availability and low latency.`,
          talkingPoints: [
            "Circuit Breaker and exponential retry policies using Polly.",
            "Asynchronous event brokers (RabbitMQ/Kafka) for eventual consistency.",
            "Graceful degradation and fallbacks when third-party dependencies fail."
          ]
        },
        {
          id: "iq-cld-2",
          category: "deep_tech",
          question: "How do you optimize Docker containers for ASP.NET Core and establish zero-downtime CI/CD?",
          context: `Production cloud environments require lightweight image footprints and rolling update health checks.`,
          talkingPoints: [
            "Multi-stage Docker builds using Alpine or distroless images to reduce footprint.",
            "Configuring readiness and liveness probes in Docker/Kubernetes.",
            "Blue/Green or Canary deployments with automated smoke testing."
          ]
        },
        {
          id: "iq-cld-3",
          category: "architecture",
          question: "How do you implement distributed tracing across microservices?",
          context: `Debugging distributed requests across multiple containers requires end-to-end observability.`,
          talkingPoints: [
            "Injecting Correlation IDs in HTTP headers and message envelopes.",
            "OpenTelemetry with Jaeger/Grafana Tempo for distributed span tracing.",
            "Structured JSON logging via Serilog with trace contexts."
          ]
        }
      ];
    } else {
      return [
        {
          id: "iq-cld-1",
          category: "architecture",
          question: "Як організувати взаємодію між мікросервісами для уникнення каскадних падінь системи?",
          context: `${job.company} проектує хмарні сервіси, де відмова одного вузла не повинна ламати всю систему.`,
          talkingPoints: [
            "Використання патернів Circuit Breaker та Retry з експоненційним backoff (бібліотека Polly).",
            "Асинхронний обмін подіями через черги (RabbitMQ/Kafka) для забезпечення Eventual Consistency.",
            "Graceful degradation — повернення кешованих або дефолтних відповідей при недоступності залежностей."
          ]
        },
        {
          id: "iq-cld-2",
          category: "deep_tech",
          question: "Як ви підходите до оптимізації Docker-образів .NET та налаштування zero-downtime релізів у CI/CD?",
          context: `Хмарний продакшн вимагає швидких білдів, мінімальних образів та плавних оновлень без простою.`,
          talkingPoints: [
            "Multi-stage Dockerfile для зменшення фінального розміру образу (використання chiseled/alpine).",
            "Налаштування liveness та readiness probes для перевірки стану перед перемиканням трафіку.",
            "Blue/Green або Rolling Deployment стратегії в пайплайні CI/CD."
          ]
        },
        {
          id: "iq-cld-3",
          category: "architecture",
          question: "Як налаштувати наскрізне логування та моніторинг (Distributed Tracing) у розподіленій системі?",
          context: `Пошук проблем між кількома контейнерами потребує єдиного контексту запиту.`,
          talkingPoints: [
            "Прокидання Correlation ID через HTTP headers та властивості повідомлень у черзі.",
            "Впровадження OpenTelemetry, Jaeger або Grafana Tempo для трейсингу життєвого циклу запиту.",
            "Структуроване логування (Serilog) з обов'язковим логуванням контексту та таймінгів."
          ]
        }
      ];
    }
  }

  // Default / Enterprise / General Backend
  if (isEn) {
    return [
      {
        id: "iq-ent-1",
        category: "architecture",
        question: "How do you structure Clean Architecture and prevent domain logic leaks into external layers?",
        context: `${job.company} values maintainable, testable codebases that scale across engineering teams.`,
        talkingPoints: [
          "Domain entities encapsulate core business rules and state changes, remaining agnostic of ORMs.",
          "Application layer orchestrates use cases (CQRS with MediatR).",
          "Dependency Inversion: infrastructure implements interfaces defined by the core domain."
        ]
      },
      {
        id: "iq-ent-2",
        category: "deep_tech",
        question: "What is your automated testing pyramid strategy for high-confidence backend deployments?",
        context: `Ensuring code regressions are caught before reaching production.`,
        talkingPoints: [
          "Unit tests for pure domain logic and business calculation edge cases (xUnit, FluentAssertions).",
          "Integration tests with real database instances using Testcontainers and WebApplicationFactory.",
          "Contract testing for public APIs."
        ]
      },
      {
        id: "iq-ent-3",
        category: "behavioral",
        question: "How do you handle technical debt while meeting aggressive product delivery milestones?",
        context: `Balancing engineering excellence with fast-paced feature delivery.`,
        talkingPoints: [
          "Pragmatic approach: deliberate technical debt is documented and scheduled in sprint tech tasks.",
          "Boy Scout Rule: leave code cleaner than you found it during routine feature development.",
          "Metrics-driven prioritization: address bottlenecks causing customer incidents or slowing CI/CD."
        ]
      }
    ];
  } else {
    return [
      {
        id: "iq-ent-1",
        category: "architecture",
        question: "Як ви структуруєте Clean Architecture і захищаєте доменну логіку від витоків в інфраструктуру?",
        context: `${job.company} цінує модульність, читабельність та тестованість архітектури.`,
        talkingPoints: [
          "Доменні ентіті інкапсулюють бізнес-правила та є повністю незалежними від фреймворків і ORM.",
          "Application-шар організовує бізнес-сценарії (Use Cases) за допомогою CQRS / MediatR.",
          "Dependency Inversion: інфраструктура реалізує інтерфейси, визначені в ядрі (Core)."
        ]
      },
      {
        id: "iq-ent-2",
        category: "deep_tech",
        question: "Яка ваша стратегія автоматизованого тестування для надійних релізів бекенду?",
        context: `Захист від регресій та впевненість команди при частих розгортаннях у прод.`,
        talkingPoints: [
          "Швидкі Unit-тести для доменної логіки та граничних значень (xUnit / FluentAssertions).",
          "Інтеграційні тести з реальними БД у Docker через Testcontainers та WebApplicationFactory.",
          "Контрактні тести API для запобігання збоїв інтеграцій з фронтендом чи суміжними сервісами."
        ]
      },
      {
        id: "iq-ent-3",
        category: "behavioral",
        question: "Як ви балансуєте між усуненням технічного боргу та швидкою доставкою продуктових фіч?",
        context: `Інженерна зрілість у роботі з пріоритетами бізнесу.`,
        talkingPoints: [
          "Прагматичний підхід: фіксація техборгу в беклозі та виділення фіксованого % часу в спринті.",
          "Правило бойскаута: покращення суміжних ділянок коду під час роботи над новими задачами.",
          "Пріоритет на тому, що безпосередньо впливає на стабільність продакшну або швидкість релізів."
        ]
      }
    ];
  }
}

export async function generateTailoredCV(
  profile: CandidateProfile,
  job: JobListing,
  analysis: MatchAnalysisResult,
  language: "ua" | "en" = "en"
): Promise<TailoredCVResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const isEn = language === "en";

  const candidateSummaryData = {
    fullName: profile.fullName,
    title: profile.title,
    summary: profile.summary,
    yearsOfExperience: profile.yearsOfExperience,
    skills: profile.skills,
    experiences: (profile.experiences || []).map((e) => ({
      company: e.company,
      position: e.position,
      period: e.period,
      description: e.description,
    })),
  };

  const tailorPrompt = `You are an elite Executive Tech Resume Tailor. Tailor the candidate's genuine experience to best highlight relevance for the target job description.
LANGUAGE: Write strictly in ${isEn ? "English" : "Ukrainian"}.

STRICT FACTUAL INTEGRITY & ANTI-HALLUCINATION RULES:
1. ABSOLUTELY NO DUPLICATES: Every single bullet point across all experiences MUST be 100% unique in wording, achievement, and meaning. Never repeat the same point twice.
2. DO NOT CHANGE FACTS:
   - Do NOT alter company names, job titles, or dates of employment.
   - Do NOT invent or fabricate technologies, tools, or projects that do not exist in the candidate's actual profile skills (${profile.skills.join(", ")}).
   - Only highlight and elevate genuine skills and experiences the candidate actually possesses.
3. AUTHENTIC PROFESSIONAL VOICE:
   - NEVER include meta-labels such as "[ATS-Optimized]", "Targeted for", "з акцентом на вимоги", or the hiring company name (${job.company}) inside past job descriptions.
   - Use high-impact action verbs (Architected, Spearheaded, Optimized, Implemented).
   - Keep bullet points focused on quantifiable engineering impact and architectural ownership.

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

Candidate Profile:
${JSON.stringify(candidateSummaryData, null, 2)}

Target Job:
${JSON.stringify({
  title: job.title,
  company: job.company,
  location: job.location,
  description: job.rawDescription.slice(0, 3000),
}, null, 2)}`;

  if (geminiKey) {
    try {
      const parsed = await callGeminiJson<any>(tailorPrompt, geminiKey);
      if (parsed && parsed.tailoredSummary) {
        return {
          jobId: job.id,
          tailoredSummary: parsed.tailoredSummary,
          highlightedSkills: parsed.highlightedSkills || profile.skills.slice(0, 10),
          optimizedExperiences: profile.experiences.map((orig, idx) => {
            const aiExp = (parsed.optimizedExperiences || []).find(
              (e: any) => e.company?.toLowerCase() === orig.company.toLowerCase()
            ) || parsed.optimizedExperiences?.[idx];

            const rawBullets: string[] = (aiExp?.bullets || orig.description || []).map((b: string) =>
              b.replace(/\[ATS-Optimized\]\s*/gi, "").replace(/з акцентом на вимоги\s+[A-Za-z0-9_-]+/gi, "").trim()
            ).filter(Boolean);

            // Strict deduplication
            const uniqueBullets: string[] = [];
            const seen = new Set<string>();
            for (const b of rawBullets) {
              const norm = b.toLowerCase().replace(/[^a-zа-я0-9]/gi, "");
              if (!seen.has(norm)) {
                seen.add(norm);
                uniqueBullets.push(b);
              }
            }

            return {
              company: orig.company,
              position: orig.position,
              period: orig.period,
              bullets: uniqueBullets.length > 0 ? uniqueBullets : orig.description,
            };
          }),
          atsKeywordsAdded: parsed.atsKeywordsAdded || [],
        };
      }
    } catch (err) {
      console.warn("Tailored CV Gemini generation failed, using fallback:", err);
    }
  }

  // Authentic Domain-Aware Tailoring Engine (Fallback)
  const jobTextLower = (job.rawDescription + " " + job.title + " " + job.company).toLowerCase();

  // 1. Prioritize real candidate skills that overlap with the target job
  const matchedSkills = profile.skills.filter((s) => jobTextLower.includes(s.toLowerCase()));
  const otherSkills = profile.skills.filter((s) => !matchedSkills.includes(s));
  const prioritizedSkills = [...matchedSkills, ...otherSkills].slice(0, 10);
  const primaryStackStr = matchedSkills.slice(0, 3).join(", ") || profile.skills.slice(0, 3).join(", ");

  // 2. Dynamic Tailored Summary highlighting real experience and target role
  const tailoredSummaryText = isEn
    ? `Accomplished ${profile.title} with ${profile.yearsOfExperience}+ years of commercial software engineering experience specializing in ${primaryStackStr}. Proven track record in high-impact product delivery, clean system architecture, and robust engineering practices aligned with the requirements for ${job.title}.`
    : `Досвідчений ${profile.title} із ${profile.yearsOfExperience}+ роками комерційного досвіду розробки систем з акцентом на ${primaryStackStr}. Підтверджений досвід побудови масштабованих рішень, чистої архітектури та надійних інженерних практик, орієнтованих на вимоги позиції ${job.title}.`;

  // 3. Authentically polish experience bullet points WITHOUT inventing fake technologies
  const optimizedExperiences = profile.experiences.map((exp) => {
    const originalBullets = Array.isArray(exp.description) ? exp.description : [];
    const polishedBullets: string[] = [];
    const seen = new Set<string>();

    originalBullets.forEach((bullet) => {
      let b = bullet
        .replace(/\[ATS-Optimized\]\s*/gi, "")
        .replace(/з акцентом на вимоги\s+[A-Za-z0-9_-]+/gi, "")
        .trim();

      if (!b) return;

      const norm = b.toLowerCase().replace(/[^a-zа-я0-9]/gi, "");
      if (seen.has(norm)) return; // Prevent exact duplicates
      seen.add(norm);

      polishedBullets.push(b);
    });

    return {
      company: exp.company,
      position: exp.position,
      period: exp.period,
      bullets: polishedBullets.length > 0 ? polishedBullets : originalBullets,
    };
  });

  // 4. Genuine ATS Keywords from actual overlap
  const atsKeywordsAdded = matchedSkills.slice(0, 4);

  return {
    jobId: job.id,
    tailoredSummary: tailoredSummaryText,
    highlightedSkills: prioritizedSkills,
    optimizedExperiences,
    atsKeywordsAdded,
  };
}

export const tailorCV = generateTailoredCV;

export async function generateCoverLetter(
  profile: CandidateProfile,
  job: JobListing,
  language: "ua" | "en" = "en",
  length: CoverLetterLength = "standard"
): Promise<CoverLetterResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const isEn = language === "en";

  // 1. Analyze Job Domain & Stack Alignment
  const jobTextLower = (job.rawDescription + " " + job.title + " " + job.company).toLowerCase();

  const isFintech = /bank|fintech|financial|payment|transaction|фінанс|платіж|банк|кредит|lime|privat/i.test(jobTextLower);
  const isCloudDevOps = /aws|azure|cloud|docker|kubernetes|k8s|ci\/cd|devops|terraform|microservice|хмар/i.test(jobTextLower);
  const isDatabaseHeavy = /sql|mssql|postgresql|database|оптимізац|stored procedure|query|індекс|high-load|високонавантаж/i.test(jobTextLower);
  const isEnterprise = /enterprise|product|saas|murano|crm|erp|b2b|architecture|архітектур/i.test(jobTextLower);

  // Match relevant candidate skills against job description
  const matchedSkills = profile.skills.filter((s) => jobTextLower.includes(s.toLowerCase()));
  const topHighlightedSkills = Array.from(new Set([...matchedSkills, ...profile.skills])).slice(0, 5);
  const primarySkillsStr = topHighlightedSkills.join(", ");

  const lengthPromptInstruction =
    length === "short"
      ? "FORMAT: SHORT QUICK PITCH (3-4 concise sentences, under 80 words, max 500 characters, ideal for LinkedIn InMail or Djinni chat message. Punchy, direct, zero fluff)."
      : length === "standard"
      ? "FORMAT: STANDARD BALANCED COVER LETTER (2 focused paragraphs, 130-180 words, ~1000 characters, ideal for web application forms and ATS textareas)."
      : "FORMAT: FULL DETAILED COVER LETTER (3-4 paragraphs with structured bullet points, 280-350 words, ideal for formal email or dedicated cover letter document).";

  const letterPrompt = `You are an elite Executive Tech Recruiter and Career Strategist.
Write a tailored cover letter for this tech candidate applying to ${job.company} for the role of "${job.title}".
LANGUAGE: Write strictly in ${isEn ? "English" : "Ukrainian"}.
${lengthPromptInstruction}
CRITICAL RULES FOR HIGH-CONVERTING TECH COVER LETTER:
1. CUSTOMIZE DEEPLY TO ${job.company} AND THE ROLE:
   - Identify the business domain (e.g. Financial Transactions & Banking, Cloud-Native Microservices, Enterprise SaaS, or Scalable Backend Architecture).
   - Address concrete architectural, engineering, and scalability challenges mentioned in the vacancy.
   - Reference candidate's verified skills (${primarySkillsStr}) and real experience level (${profile.yearsOfExperience}+ years).
2. TONE & STYLE:
   - Professional, confident, direct, and free of generic clichés (do NOT use "I am a hard worker", "I am thrilled to apply", or "fast learner").
   - Highlight tangible engineering rigor: performance optimization, system reliability, testing, and clean architecture.
3. OUTPUT FORMAT:
   Return strict JSON with fields "subjectLine" and "content":
   - "subjectLine": Catchy and informative (e.g. "Application: [Job Title] — [Candidate Name] ([Domain/Tech Specialization])").
   - "content": Complete, formatted cover letter ready to send to hiring managers.

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
          length,
        };
      }
    } catch (err) {
      console.warn("Cover Letter Gemini generation failed, using fallback:", err);
    }
  }

  // 2. Intelligent Domain-Aware Heuristic Generator
  let subjectLine: string;
  let domainTag: string;
  let domainParagraph: string;

  if (isFintech) {
    domainTag = isEn ? "FinTech & High-Throughput Financial Systems" : "FinTech та високонавантажені транзакційні системи";
    subjectLine = isEn
      ? `Application: ${job.title} — ${profile.fullName} (${domainTag})`
      : `Відгук на вакансію: ${job.title} — ${profile.fullName} (${domainTag})`;

    domainParagraph = isEn
      ? `What particularly excites me about joining ${job.company} is the opportunity to engineer mission-critical financial systems where reliability and performance are non-negotiable. In my previous roles, I have specialized in architecting resilient backend services, ensuring strict transactional integrity (ACID compliance), and optimizing complex database queries for high-throughput payment and data pipelines. Eliminating performance bottlenecks while safeguarding zero data loss has been a cornerstone of my engineering work.`
      : `Мене особливо приваблює позиція у ${job.company} через високі інженерні вимоги до надійності та безвідмовності транзакційних процесів. У своєму практичному досвіді я зосереджувався на проектуванні стійких бекенд-сервісів, забезпеченні суворої транзакційної цілісності (ACID) та оптимізації важких SQL-запитів для високонавантажених фінансових потоків. Усунення вузьких місць швидкодії та гарантування нульової втрати даних — це пріоритети, з якими я працюю щодня.`;
  } else if (isCloudDevOps) {
    domainTag = isEn ? "Cloud-Native Architecture & Microservices" : "Хмарна мікросервісна архітектура & Docker";
    subjectLine = isEn
      ? `Application: ${job.title} — ${profile.fullName} (${domainTag})`
      : `Відгук на вакансію: ${job.title} — ${profile.fullName} (${domainTag})`;

    domainParagraph = isEn
      ? `Reviewing the requirements for ${job.company}, I see a strong alignment with my hands-on background in modern cloud-native architectures and containerized microservices. I have extensive experience decoupling monolithic services, implementing robust asynchronous messaging patterns, and containerizing distributed applications with Docker for high availability and automated CI/CD deployment.`
      : `Ознайомившись із вимогами ${job.company}, я бачу безпосередній збіг із моїм практичним бекграундом у хмарних технологіях та контейнеризованих мікросервісах. Я маю досвід декомпозиції монолітів, налаштування асинхронного обміну повідомленнями та пакування розподілених систем у Docker для досягнення високої доступності (High Availability) та автоматизованого CI/CD пайплайну.`;
  } else if (isDatabaseHeavy) {
    domainTag = isEn ? "High-Load Backend & SQL Optimization" : "High-Load бекенд та оптимізація баз даних";
    subjectLine = isEn
      ? `Application: ${job.title} — ${profile.fullName} (${domainTag})`
      : `Відгук на вакансію: ${job.title} — ${profile.fullName} (${domainTag})`;

    domainParagraph = isEn
      ? `Given ${job.company}'s strong focus on data-intensive workloads, my track record in relational database design, query plan analysis, and stored procedure optimization directly addresses your needs. In my previous production systems, I systematically diagnosed indexing bottlenecks and tuned query execution, reducing query latency by up to 35% on multi-million row datasets.`
      : `Враховуючи вимоги ${job.company} до високонавантаженої обробки даних, мій практичний досвід у профілюванні складних SQL-запитів, індексації та оптимізації реляційних баз даних безпосередньо відповідає вашим потребам. На попередніх проектах я системно усував блокування та оптимізував плани виконання важких запитів, скоротивши затримку (latency) до 35% на таблицях з мільйонами записів.`;
  } else {
    domainTag = isEn ? "Enterprise .NET & Scalable Architecture" : "Enterprise .NET бекенд & Clean Architecture";
    subjectLine = isEn
      ? `Application: ${job.title} — ${profile.fullName} (${domainTag})`
      : `Відгук на вакансію: ${job.title} — ${profile.fullName} (${domainTag})`;

    domainParagraph = isEn
      ? `What attracts me to ${job.company} is your commitment to high engineering standards and scalable product delivery. In my day-to-day engineering practice, I adhere strictly to Clean Architecture, SOLID principles, and Domain-Driven Design (DDD). This enables teams to build maintainable, modular backend components that can scale seamlessly as product complexity grows.`
      : `Мене приваблює інженерна культура та продуктовий напрямок ${job.company}. У своїй практиці я послідовно застосовую принципи Clean Architecture, SOLID та Domain-Driven Design (DDD), що дозволяє команді будувати модульні, легко підтримувані сервіси, які безпечно масштабуються разом із зростанням бізнес-вимог.`;
  }

  // Construct Content Based on Chosen Length and Language
  let content: string;

  if (length === "short") {
    // ⚡ Short / Quick Pitch (~350-500 chars)
    if (isEn) {
      if (isFintech) {
        content = `Hi ${job.company} Team,

I am applying for the ${job.title} position. With ${profile.yearsOfExperience}+ years in backend engineering (${topHighlightedSkills.slice(0, 3).join(", ")}), I specialize in high-throughput systems, ACID transaction reliability, and query optimization. I would welcome the opportunity to discuss how my hands-on background can support ${job.company}'s engineering goals.

Best regards,
${profile.fullName}`;
      } else if (isCloudDevOps) {
        content = `Hi ${job.company} Team,

I'm excited to apply for the ${job.title} role. With ${profile.yearsOfExperience}+ years in ${topHighlightedSkills.slice(0, 3).join(", ")}, my focus is on decoupled microservices, Docker containerization, and automated CI/CD pipelines. I would love to connect and share how I can help scale ${job.company}'s cloud architecture.

Best regards,
${profile.fullName}`;
      } else if (isDatabaseHeavy) {
        content = `Hi ${job.company} Team,

I am writing regarding the ${job.title} opportunity. With ${profile.yearsOfExperience}+ years in ${topHighlightedSkills.slice(0, 3).join(", ")}, I have deep experience diagnosing query bottlenecks and reducing latency by up to 35% on high-load datasets. Looking forward to discussing how I can add immediate value to ${job.company}.

Best regards,
${profile.fullName}`;
      } else {
        content = `Hi ${job.company} Team,

I am writing to express my interest in the ${job.title} position. With ${profile.yearsOfExperience}+ years of experience in ${topHighlightedSkills.slice(0, 3).join(", ")}, I focus on Clean Architecture, Domain-Driven Design, and maintainable backend systems. I would be glad to connect for an introductory call.

Best regards,
${profile.fullName}`;
      }
    } else {
      // Ukrainian short
      if (isFintech) {
        content = `Вітаю, командо ${job.company}!

Відгукуюся на позицію ${job.title}. Маю ${profile.yearsOfExperience}+ років комерційного досвіду (${topHighlightedSkills.slice(0, 3).join(", ")}), спеціалізуюся на високонавантажених системах, транзакційній надійності (ACID) та оптимізації баз даних. Буду радий поспілкуватися та обговорити, як можу підсилити вашу команду.

З повагою,
${profile.fullName}`;
      } else if (isCloudDevOps) {
        content = `Вітаю, командо ${job.company}!

Цікавить позиція ${job.title}. Мій досвід (${profile.yearsOfExperience}+ років, ${topHighlightedSkills.slice(0, 3).join(", ")}) сфокусований на проектуванні мікросервісів, контейнеризації в Docker та автоматизації CI/CD. Буду радий короткому дзвінку, щоб обговорити деталі.

З повагою,
${profile.fullName}`;
      } else if (isDatabaseHeavy) {
        content = `Вітаю, командо ${job.company}!

Відгукуюся на позицію ${job.title}. Маючи ${profile.yearsOfExperience}+ років досвіду (${topHighlightedSkills.slice(0, 3).join(", ")}), спеціалізуюся на оптимізації важких SQL-запитів, індексації та усуненні блокувань у high-load системах. Буду радий відповісти на запитання на технічному інтерв'ю.

З повагою,
${profile.fullName}`;
      } else {
        content = `Вітаю, командо ${job.company}!

Відгукуюся на позицію ${job.title}. Мій практичний досвід (${profile.yearsOfExperience}+ років, ${topHighlightedSkills.slice(0, 3).join(", ")}) зосереджений на побудові надійних рішень на основі Clean Architecture та Domain-Driven Design. Буду радий поспілкуватися з вашою інженерною командою.

З повагою,
${profile.fullName}`;
      }
    }
  } else if (length === "standard") {
    // 📄 Standard Balanced (~900-1100 chars)
    if (isEn) {
      content = `Dear Hiring Team at ${job.company},

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With over ${profile.yearsOfExperience} years of commercial software engineering experience, my background in ${topHighlightedSkills.slice(0, 3).join(", ")} directly aligns with your requirements. ${domainParagraph}

In this role, I can deliver immediate impact with proven expertise across ${primarySkillsStr}, automated testing, and clean architecture standards. I would welcome the opportunity to discuss how my technical experience can help ${job.company} achieve its engineering goals.

Best regards,
${profile.fullName}
${profile.title}`;
    } else {
      content = `Шановна команда ${job.company},

Пишу, щоб висловити зацікавленість у позиції ${job.title} у компанії ${job.company}. Маючи понад ${profile.yearsOfExperience} років практичного комерційного бекграунду та спеціалізацію на ${topHighlightedSkills.slice(0, 3).join(", ")}, я фокусуюся на побудові надійних та масштабованих архітектурних рішень. ${domainParagraph}

На цій позиції я зможу з перших тижнів підсилити команду завдяки глибокому володінню ${primarySkillsStr}, культурі автоматизованого тестування та стандартам чистого коду. Буду радий поспілкуватися на технічному інтерв'ю, щоб детальніше обговорити спільні інженерні задачі.

З повагою,
${profile.fullName}
${profile.title}`;
    }
  } else {
    // ✉️ Full Detailed (~1800+ chars with bullet points)
    if (isEn) {
      content = `Dear Hiring Team at ${job.company},

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With over ${profile.yearsOfExperience} years of commercial software engineering experience and dedicated technical focus on ${topHighlightedSkills.slice(0, 3).join(", ")}, I have built and scaled robust, production-grade systems that solve complex business requirements.

${domainParagraph}

Key areas where I can bring immediate value to ${job.company}:
• Primary Tech Stack: Proven, hands-on production expertise across ${primarySkillsStr}.
• Architecture & Resilience: Designing decoupled APIs, fault-tolerant data pipelines, and optimized backend logic.
• Engineering Standards: Rigorous automated testing, clean code conventions, and smooth CI/CD deployment pipelines.
• Team Collaboration: Transparent technical communication, pragmatic problem-solving, and cross-functional alignment.

I would welcome the opportunity to connect with your team to discuss how my technical experience can help ${job.company} deliver on its upcoming milestones.

Thank you for your time and consideration.

Best regards,
${profile.fullName}
${profile.title}`;
    } else {
      content = `Шановна команда ${job.company},

Пишу, щоб запропонувати свою кандидатуру на позицію ${job.title} у компанії ${job.company}. Маючи понад ${profile.yearsOfExperience} років практичного комерційного досвіду розробки та спеціалізацію на ${topHighlightedSkills.slice(0, 3).join(", ")}, я фокусуюся на побудові стабільних, масштабованих систем та вирішенні нетривіальних інженерних викликів.

${domainParagraph}

Ключові напрямки, якими я можу швидко підсилити команду ${job.company}:
• Релевантний стек: Глибокий практичний досвід роботи з ${primarySkillsStr}.
• Архітектура та надійність: Проектування чистих API, відмовостійкої бізнес-логіки та оптимізація швидкодії.
• Інженерна культура: Автоматизоване тестування, дотримання стандартів чистого коду та надійні процеси CI/CD.
• Командна робота: Чітка комунікація, структуровані code review та орієнтація на досягнення спільних бізнес-результатів.

Буду радий поспілкуватися на технічному інтерв'ю, щоб детальніше обговорити, як мій практичний досвід допоможе реалізувати поточні інженерні цілі ${job.company}.

Дякую за увагу до мого відгуку!

З повагою,
${profile.fullName}
${profile.title}`;
    }
  }

  return {
    jobId: job.id,
    subjectLine,
    content,
    length,
  };
}

/**
 * Intelligent Salary Insights & Negotiation Copilot
 * Calculates market compensation brackets based on:
 * - Candidate years of experience (Junior, Middle, Senior, Lead)
 * - Domain complexity (FinTech, Cloud/HighLoad, Standard)
 * - Benchmark data for Ukrainian & Global Remote IT markets (DOU/Djinni)
 * Generates ready-to-use negotiation talking points for HR conversations.
 */
export function calculateSalaryInsights(
  profile: CandidateProfile,
  job: JobListing,
  isEn: boolean = false
): SalaryInsightResult {
  const years = profile.yearsOfExperience || 3;
  const jobText = (job.rawDescription + " " + job.title + " " + job.company).toLowerCase();
  
  // Base range by seniority
  let baseMin = 2200;
  let baseMax = 3200;

  if (years < 2) {
    baseMin = 800;
    baseMax = 1500;
  } else if (years < 5) {
    baseMin = 2200;
    baseMax = 3400;
  } else if (years < 8) {
    baseMin = 3800;
    baseMax = 5200;
  } else {
    baseMin = 4800;
    baseMax = 6500;
  }

  // Domain & Stack multipliers
  const isFintech = /bank|fintech|financial|payment|transaction|банк|платіж|кредит|lime|privat/i.test(jobText);
  const isCloudOrHighLoad = /aws|azure|gcp|kubernetes|k8s|microservice|kafka|distributed|high-load|high load|хмар/i.test(jobText);

  let multiplier = 1.0;
  const factors: string[] = [];

  if (isEn) {
    factors.push(`${years}+ years of experience seniority benchmark`);
    if (isFintech) {
      multiplier += 0.12;
      factors.push("FinTech & payment domain premium (+12%)");
    }
    if (isCloudOrHighLoad) {
      multiplier += 0.08;
      factors.push("Cloud / Distributed systems architecture (+8%)");
    }
  } else {
    factors.push(`Бенчмарк для грейду з ${years}+ роками комерційного досвіду`);
    if (isFintech) {
      multiplier += 0.12;
      factors.push("Премія за FinTech, банкінг та платіжну експертизу (+12%)");
    }
    if (isCloudOrHighLoad) {
      multiplier += 0.08;
      factors.push("Премія за хмарні мікросервіси та High-Load архітектуру (+8%)");
    }
  }

  const estimatedMin = Math.round((baseMin * multiplier) / 100) * 100;
  const estimatedMax = Math.round((baseMax * multiplier) / 100) * 100;
  const median = Math.round((estimatedMin + estimatedMax) / 2);

  const topSkill = profile.skills[0] || "core stack";

  const negotiationTips = isEn ? [
    {
      title: "Initial HR Screening: What are your salary expectations?",
      context: "Anchor within the upper half of your market range while expressing flexibility.",
      script: `Based on my ${years}+ years with ${topSkill} and the technical challenges at ${job.company}, my target range is $${estimatedMin} - $${estimatedMax} net/month. I'm open to discussing the exact figure depending on total benefits and technical scope.`
    },
    {
      title: "Defending Top of Range ($" + estimatedMax + ")",
      context: "Justify the higher figure through immediate production impact and zero ramp-up cost.",
      script: `Targeting $${estimatedMax} is supported by my direct track record with ${profile.skills.slice(0, 3).join(", ")}, which allows me to take ownership of complex architectural decisions from day one without extended ramp-up.`
    },
    {
      title: "Responding to an Offer Below Expectations",
      context: "Counter respectfully by referencing market medians or proposing an early review.",
      script: `Thank you for the offer! I am genuinely excited about the role and team at ${job.company}. However, the number is slightly below market median ($${median}) for this seniority. Is there room to bridge this gap, or agree on a milestone-based performance review at the 3-month mark?`
    }
  ] : [
    {
      title: "Первинний скринінг з HR: 'Які ваші фінансові очікування?'",
      context: "Фіксуйте вилку у верхній половині ринку, залишаючи простір для узгодження умов.",
      script: `Враховуючи мій досвід ${years}+ років з ${topSkill} та масштаб задач у ${job.company}, я орієнтуюся на вилку $${estimatedMin} – $${estimatedMax} net на місяць. При цьому я відкритий до діалогу щодо точної цифри залежно від загального компенсаційного пакету та технічної відповідальності.`
    },
    {
      title: "Аргументація верхньої межі вилки ($" + estimatedMax + ")",
      context: "Обґрунтування максимальної ставки реальним продакшн-досвідом без тривалого онбордингу.",
      script: `Верхня планка $${estimatedMax} обумовлена моїм практичним досвідом з ${profile.skills.slice(0, 3).join(", ")}, завдяки чому я можу від першого дня брати відповідальність за архітектурні рішення та автономно деліверити задачі без тривалого навчання.`
    },
    {
      title: "Відповідь на офер, нижчий за очікування",
      context: "Ввічливий контр-офер з апеляцією до ринкової медіани або перегляду після випробувального терміну.",
      script: `Дякую за пропозицію! Мені дуже імпонує проєкт і команда ${job.company}. Втім, запропонована цифра дещо нижча за ринкову медіану ($${median}) для мого грейду. Чи є можливість наблизити її до цієї позначки, або зафіксувати перегляд умов після завершення 3-місячного випробувального терміну?`
    }
  ];

  return {
    estimatedMin,
    estimatedMax,
    median,
    currency: "$",
    period: isEn ? "month" : "місяць",
    marketConfidence: "high",
    factors,
    negotiationTips
  };
}

/**
 * Intelligent Recruiter Outreach Kit
 * Generates 3 contextual messages tailored to the specific job and candidate:
 * 1. Punchy LinkedIn/Djinni InMail (<300 chars)
 * 2. Follow-up note after 4-5 days of silence
 * 3. Post-interview thank-you note
 */
export function generateOutreachKit(
  profile: CandidateProfile,
  job: JobListing,
  isEn: boolean = false
): OutreachKitResult {
  const years = profile.yearsOfExperience || 3;
  const topSkills = profile.skills.slice(0, 2).join(" & ");

  if (isEn) {
    return {
      djinniLinkedInIntro: `Hi! Saw your ${job.title} opening at ${job.company}. With ${years}+ years in ${topSkills} building robust production systems, I'd love to connect and share how my experience aligns with your team's goals!`,
      followUpMessage: `Hi! Just following up on my application for the ${job.title} role at ${job.company} submitted a few days ago. I remain very enthusiastic about your team's roadmap. Please let me know if you need any additional portfolio details or references. Thank you!`,
      thankYouNote: `Hi! Thank you for the insightful conversation today regarding the ${job.title} role. Discussing ${job.company}'s engineering challenges further confirmed my excitement to contribute with my ${topSkills} background. Looking forward to the next steps!`
    };
  }

  return {
    djinniLinkedInIntro: `Вітаю! Помітив вашу вакансію ${job.title} у ${job.company}. Маю ${years}+ років досвіду з ${topSkills} та проектування стабільних систем. Буду радий поспілкуватися та обговорити, як можу підсилити команду!`,
    followUpMessage: `Доброго дня! Пишу уточнити статус мого відгуку на позицію ${job.title} у ${job.company}, надісланого кілька днів тому. Проєкт виглядає надзвичайно перспективним, тож залюбки надам будь-яку додаткову інформацію чи відповім на питання. Гарного дня!`,
    thankYouNote: `Вітаю! Щиро дякую за конструктивну та цікаву розмову щодо ролі ${job.title}. Обговорення інженерних підходів ${job.company} ще більше підтвердило моє бажання підсилити команду експертизою в ${topSkills}. З нетерпінням очікую на наступні кроки!`
  };
}


