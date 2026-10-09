"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, CheckCircle2, Bot } from "lucide-react";
import { JobListing } from "@/types";
import { translations, Language } from "@/lib/translations";

interface AddJobFormProps {
  onAnalyze: (job: JobListing) => void;
  isLoading: boolean;
  lang?: Language;
}

export function AddJobForm({ onAnalyze, isLoading, lang = "ua" }: AddJobFormProps) {
  const t = translations[lang].addJob;
  const [inputText, setInputText] = useState("");
  const [timelineStep, setTimelineStep] = useState(0);
  const [isParsingUrl, setIsParsingUrl] = useState(false);

  const activeLoading = isLoading || isParsingUrl;

  // Simulated AI Pipeline steps for realistic Copilot feel
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeLoading) {
      setTimelineStep(1);
      interval = setInterval(() => {
        setTimelineStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 700);
    } else {
      setTimelineStep(0);
    }
    return () => clearInterval(interval);
  }, [activeLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || activeLoading) return;

    const trimmed = inputText.trim();
    const isUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://");

    if (isUrl) {
      setIsParsingUrl(true);
      try {
        const res = await fetch("/api/parse-job", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: trimmed }),
        });
        const data = await res.json();
        if (data.success && data.job) {
          onAnalyze(data.job);
          return;
        }
      } catch (err) {
        console.warn("Failed to parse vacancy from URL, using fallback:", err);
      } finally {
        setIsParsingUrl(false);
      }
    }

    // Smart auto-extraction from raw text or URL fallback
    const lines = inputText.split("\n").map(l => l.trim()).filter(Boolean);

    let guessedTitle = "Senior Software Engineer";
    let guessedCompany = "Company";
    let guessedSalary: string | undefined = undefined;

    if (!isUrl && lines.length > 0) {
      // Find title & company heuristics
      guessedTitle = lines[0].replace(/^(We are looking for|Hiring|Role:|Position:)/i, "").trim().slice(0, 50) || guessedTitle;
      
      const salaryMatch = inputText.match(/(\$\s?[\d,]+(?:\s?-\s?[\d,]+)?(?:\s?k)?)/i);
      if (salaryMatch) guessedSalary = salaryMatch[1];

      const companyMatch = inputText.match(/(?:at|company|team at|Meet the|About)\s+([A-Z][A-Za-z0-9\s]{2,25})/i);
      if (companyMatch) guessedCompany = companyMatch[1].trim();
    } else if (isUrl) {
      if (inputText.includes("djinni.co")) {
        const slugMatch = inputText.match(/company-([^/]+)/i);
        guessedCompany = slugMatch ? slugMatch[1].split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Djinni Employer";
      } else if (inputText.includes("dou.ua")) {
        const douMatch = inputText.match(/companies\/([^/]+)/i);
        guessedCompany = douMatch ? decodeURIComponent(douMatch[1]).split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "DOU Employer";
      } else if (inputText.includes("linkedin.com")) {
        guessedCompany = "LinkedIn Employer";
      }
    }

    const newJob: JobListing = {
      id: "job-" + Date.now(),
      title: guessedTitle,
      company: guessedCompany,
      location: "Remote / Hybrid",
      salary: guessedSalary,
      sourceUrl: isUrl ? inputText.trim() : undefined,
      rawDescription: inputText,
      createdAt: new Date().toISOString(),
    };

    onAnalyze(newJob);
  };

    const sampleFintech = `Senior .NET Developer at Lime Systems
Salary: $4,000 - $5,500 · Kyiv / Remote

About Lime Systems:
Розробник автоматизованих банківських систем та програмного забезпечення для провідних банків України.

Вимоги:
- 5+ років комерційного досвіду з C# та .NET Core / ASP.NET Core
- Глибокі знання MS SQL Server (T-SQL, збережені процедури, індекси, оптимізація запитів)
- Розуміння високонавантажених фінансових транзакцій, ACID та цілісності даних
- Досвід побудови RESTful API та оптимізації швидкодії бекенд-сервісів
- Досвід роботи з Docker та Git`;

    const sampleCloud = `Senior .NET Software Engineer at Murano Software
Salary: $4,500 - $6,000 · Remote

About the Project:
Cloud-native enterprise platform processing high-volume asynchronous message queues.

Requirements:
- 5+ років досвіду з C#, .NET 8, ASP.NET Core
- Strong experience designing distributed microservices architectures
- Hands-on expertise with Docker, Kubernetes, and automated CI/CD pipelines
- Experience with cloud services (AWS or Azure) and message brokers (RabbitMQ/Kafka)
- Clean Architecture, SOLID, and Automated Integration Testing (xUnit)
- Upper-Intermediate English (B2+)`;

    const sampleMismatch = `Senior Full-Stack Developer (Node.js & Angular) at PrivatBank
Salary: $3,500 - $4,500 · Дніпро / Remote

Опис вакансії:
ПриватБанк шукає досвідченого Senior розробника для розвитку клієнтських веб-сервісів Приват24.

Ключові вимоги:
- 5+ років комерційного досвіду Frontend розробки на Angular 16+ та TypeScript
- Глибокі знання Node.js (NestJS / Express) для розробки мікросервісних BFF
- RxJS, State Management (NgRx), HTML5, SCSS, WebSockets
- Досвід з NoSQL (MongoDB) та Redis
- Навички оптимізації Web Vitals та безпеки веб-додатків`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 mb-8 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
            <Bot className="w-4 h-4" />
            {t.engineBadge}
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
            {t.heading}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t.subheading}
          </p>
        </div>

        {/* 3 Presets in 1 click */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block sm:hidden w-full mb-1">
            {t.presetsLabel}
          </span>
          <button
            type="button"
            onClick={() => setInputText(sampleFintech)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition border border-slate-200 shadow-2xs"
            title="Lime Systems FinTech .NET"
          >
            {t.presetFintech}
          </button>
          <button
            type="button"
            onClick={() => setInputText(sampleCloud)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition border border-slate-200 shadow-2xs"
            title="Murano Cloud Microservices"
          >
            {t.presetCloud}
          </button>
          <button
            type="button"
            onClick={() => setInputText(sampleMismatch)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition border border-rose-200 shadow-2xs"
            title="PrivatBank Angular/Node Mismatch Test"
          >
            {t.presetMismatch}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            rows={5}
            placeholder={t.placeholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={activeLoading}
            className="w-full px-4 py-3.5 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-sans leading-relaxed resize-none bg-slate-50/50 focus:bg-white"
            required
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-400">
              {t.autoHint}
            </span>

            <button
              type="submit"
              disabled={activeLoading || !inputText.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-blue-600 transition shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>{activeLoading ? (isParsingUrl ? t.fetchingUrlBtn : t.analyzingBtn) : t.calculateBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* AI Pipeline Live Timeline */}
      {activeLoading && (
        <div className="mt-6 p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 animate-in fade-in space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            {t.pipelineTitle}
          </span>

          <div className="space-y-2 text-xs">
            <div className={`flex items-center gap-2.5 transition-all ${timelineStep >= 1 ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
              {timelineStep >= 1 ? <CheckCircle2 className="w-4 h-4 text-blue-600" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
              <span>{t.step1}</span>
            </div>

            <div className={`flex items-center gap-2.5 transition-all ${timelineStep >= 2 ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
              {timelineStep >= 2 ? <CheckCircle2 className="w-4 h-4 text-blue-600" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
              <span>{t.step2}</span>
            </div>

            <div className={`flex items-center gap-2.5 transition-all ${timelineStep >= 3 ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
              {timelineStep >= 3 ? <CheckCircle2 className="w-4 h-4 text-blue-600" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
              <span>{t.step3}</span>
            </div>

            <div className={`flex items-center gap-2.5 transition-all ${timelineStep >= 4 ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
              {timelineStep >= 4 ? <CheckCircle2 className="w-4 h-4 text-emerald-600 font-bold" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
              <span>{t.step4}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
