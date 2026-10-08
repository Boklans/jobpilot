"use client";

import React, { useState, useRef } from "react";
import { 
  MatchAnalysisResult, 
  JobListing, 
  CandidateProfile, 
  TailoredCVResult, 
  CoverLetterResult 
} from "@/types";
import { 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  FileEdit, 
  Mail, 
  BookmarkPlus, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Building,
  MapPin,
  DollarSign,
  Printer,
  Trash2
} from "lucide-react";
import { generateTailoredCV, generateCoverLetter } from "@/lib/ai/matcher";
import { TailoredCVModal } from "@/components/cv/TailoredCVModal";

interface MatchAnalysisCardProps {
  job: JobListing;
  analysis: MatchAnalysisResult;
  candidate: CandidateProfile;
  onAddToTracker: (job: JobListing, score: number) => void;
  onDeleteJob?: (jobId: string) => void;
}

export function MatchAnalysisCard({ 
  job, 
  analysis, 
  candidate, 
  onAddToTracker,
  onDeleteJob
}: MatchAnalysisCardProps) {
  const tailoredCVRef = useRef<HTMLDivElement>(null);
  const coverLetterRef = useRef<HTMLDivElement>(null);
  const [tailoredCV, setTailoredCV] = useState<TailoredCVResult | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetterResult | null>(null);
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [clLang, setClLang] = useState<"en" | "ua">("en");
  const [copiedCL, setCopiedCL] = useState(false);
  const [isAddedToTracker, setIsAddedToTracker] = useState(false);
  const [showFullJob, setShowFullJob] = useState(false);
  const [showCVModal, setShowCVModal] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-700 bg-emerald-50 border-emerald-300 ring-emerald-500/20";
    if (score >= 70) return "text-blue-700 bg-blue-50 border-blue-300 ring-blue-500/20";
    if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-300 ring-amber-500/20";
    return "text-rose-700 bg-rose-50 border-rose-300 ring-rose-500/20";
  };

  const handleTailor = async () => {
    setIsGeneratingCV(true);
    try {
      const res = await generateTailoredCV(candidate, job, analysis, "en");
      setTailoredCV(res);
      setTimeout(() => {
        tailoredCVRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } finally {
      setIsGeneratingCV(false);
    }
  };

  const handleCoverLetter = async (targetLang?: "en" | "ua") => {
    const l = targetLang || clLang;
    setIsGeneratingCL(true);
    try {
      const res = await generateCoverLetter(candidate, job, l);
      setCoverLetter(res);
      setClLang(l);
      setTimeout(() => {
        coverLetterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } finally {
      setIsGeneratingCL(false);
    }
  };

  const handleCopyCL = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter.content);
      setCopiedCL(true);
      setTimeout(() => setCopiedCL(false), 2000);
    }
  };

  const handleTrackerClick = () => {
    onAddToTracker(job, analysis.score);
    setIsAddedToTracker(true);
  };

  return (
    <div id={`job-analysis-${job.id}`} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8 transition-all hover:shadow-md">
      {/* Header section */}
      <div className="p-6 sm:p-7 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Job Opportunity
              </span>
              {job.sourceUrl && (
                <a 
                  href={job.sourceUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 gap-1 font-medium"
                >
                  Відкрити оригінал <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {onDeleteJob && (
                <button
                  onClick={() => onDeleteJob(job.id)}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 px-2 py-0.5 rounded-md hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                  title="Видалити вакансію з аналізу"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Видалити</span>
                </button>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {job.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Building className="w-4 h-4 text-slate-400" />
                {job.company}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {job.location}
              </span>
              {job.salary && (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                  <DollarSign className="w-3.5 h-3.5" />
                  {job.salary}
                </span>
              )}
            </div>
          </div>

          {/* Premium Apple-style Match Score Typography */}
          <div className="flex items-baseline md:flex-col md:items-end justify-between sm:self-start md:self-auto gap-1 bg-slate-50/80 px-5 py-3 rounded-2xl border border-slate-200/60">
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl sm:text-5xl font-black tracking-tighter tabular-nums ${
                analysis.score >= 85 ? "text-emerald-600" : analysis.score >= 70 ? "text-blue-600" : "text-amber-600"
              }`}>
                {analysis.score}
              </span>
              <span className="text-sm font-bold text-slate-400">%</span>
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
              {analysis.recommendation.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Analysis Body */}
      <div className="p-6 sm:p-7 space-y-6">
        {/* Core Verdict & Biggest Concern Box */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-3.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                JobPilot Verdict:
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border ${
                analysis.score >= 85 
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : analysis.score >= 70
                  ? "bg-blue-100 text-blue-800 border-blue-300"
                  : "bg-amber-100 text-amber-800 border-amber-300"
              }`}>
                {analysis.score >= 85 ? "✓ Worth applying (Strong match)" : analysis.score >= 70 ? "⚡ Worth applying (Tailor CV recommended)" : "⚠ High competition risk"}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Шанси пройти скринінг: <strong className="text-slate-800">{analysis.score >= 85 ? "Високі" : analysis.score >= 70 ? "Помірні" : "Низькі"}</strong>
            </span>
          </div>

          {/* Biggest Concern */}
          {analysis.missingSkills.length > 0 && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                ⚠️ Biggest Concern (Головний ризик відмови):
              </span>
              <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-normal">
                {analysis.experienceGaps[0] || `Вакансія вимагає досвід з ${analysis.missingSkills.slice(0, 2).join(", ")}, що недостатньо підтверджено у вашому поточному резюме.`}
              </p>
            </div>
          )}

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            {analysis.summary}
          </p>
        </div>

        {/* Why You Match & What's Missing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Why You Match */}
          <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3.5 text-emerald-800 font-bold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Why You Match
              </span>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                {analysis.strengths.length} пунктів
              </span>
            </div>
            <ul className="space-y-2">
              {analysis.strengths.map((str, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-slate-800 flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What's Missing */}
          <div className="bg-white border border-amber-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3.5 text-amber-800 font-bold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                What's Missing
              </span>
              <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                {analysis.missingSkills.length} навичок
              </span>
            </div>
            {analysis.missingSkills.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missingSkills.map((sk, idx) => (
                    <span 
                      key={idx} 
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200"
                    >
                      ⚠ {sk}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ці вимоги шукатиме ATS або рекрутер на першому скринінгу.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Критичних прогалин у навичках не виявлено.</p>
            )}
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <button
            onClick={handleTailor}
            disabled={isGeneratingCV}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition shadow-md shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGeneratingCV ? "Адаптую резюме..." : "Tailor My CV"}</span>
          </button>

          <button
            onClick={() => handleCoverLetter()}
            disabled={isGeneratingCL}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition active:scale-[0.98] disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            <span>{isGeneratingCL ? "Пишу..." : "Write Cover Letter"}</span>
          </button>

          <button
            onClick={handleTrackerClick}
            disabled={isAddedToTracker}
            className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition ${
              isAddedToTracker
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {isAddedToTracker ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Додано в Tracker</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4 text-slate-500" />
                <span>Track Application</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowFullJob(!showFullJob)}
            className="text-xs text-slate-400 hover:text-slate-700 ml-auto inline-flex items-center gap-1 py-1"
          >
            {showFullJob ? "Сховати опис" : "Повний опис вакансії"}
            {showFullJob ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible Full Job Description */}
        {showFullJob && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed font-mono">
            {job.rawDescription}
          </div>
        )}

        {/* Generated Tailored CV Panel */}
        {tailoredCV && (
          <div ref={tailoredCVRef} className="mt-6 border border-blue-200 bg-blue-50/40 rounded-2xl p-5 space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <FileEdit className="w-4 h-4 text-blue-600" />
                <span>Адаптоване резюме під {job.company}</span>
                <span className="text-[11px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                  ATS-Optimized
                </span>
              </div>
              <button
                onClick={() => setShowCVModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-2xs self-start sm:self-auto"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Відкрити та зберегти PDF</span>
              </button>
            </div>

            {/* What Changed Transparency Box */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block">
                What JobPilot Changed (Прозорість AI):
              </span>
              <ul className="text-xs text-emerald-950 space-y-1">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Релевантні навички (<strong>{tailoredCV.highlightedSkills.slice(0, 3).join(", ")}</strong>) піднято вгору</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Summary перефокусовано на вимоги <strong>{job.company}</strong></span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Жодного вигаданого досвіду чи неіснуючих компаній</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-4 border border-blue-100 text-xs sm:text-sm space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Адаптоване резюме (Summary):
                </span>
                <p className="text-slate-800 mt-1 font-medium leading-relaxed">
                  {tailoredCV.tailoredSummary}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Пріоритетні навички (піднято нагору):
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {tailoredCV.highlightedSkills.map((sk, i) => (
                    <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Адаптовані формулювання досвіду:
                </span>
                <div className="space-y-2 mt-2">
                  {tailoredCV.optimizedExperiences.slice(0, 1).map((exp, i) => (
                    <div key={i} className="text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">{exp.company} — {exp.position}</span>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-slate-600">
                        {exp.bullets.map((b, bi) => (
                          <li key={bi}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generated Cover Letter Panel */}
        {coverLetter && (
          <div ref={coverLetterRef} className="mt-6 border border-slate-300 bg-slate-50/70 rounded-2xl p-5 space-y-4 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Супровідний лист (Cover Letter)</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Language Toggle */}
                <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 text-xs font-semibold">
                  <button
                    onClick={() => handleCoverLetter("en")}
                    disabled={isGeneratingCL}
                    className={`px-2.5 py-1 rounded transition ${
                      clLang === "en" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    onClick={() => handleCoverLetter("ua")}
                    disabled={isGeneratingCL}
                    className={`px-2.5 py-1 rounded transition ${
                      clLang === "ua" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🇺🇦 Українська
                  </button>
                </div>

                <button
                  onClick={handleCopyCL}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                >
                  {copiedCL ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Скопійовано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Скопіювати</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans">
              {isGeneratingCL ? "Генерую супровідний лист..." : coverLetter.content}
            </div>
          </div>
        )}
      </div>

      {/* Printable Tailored CV Modal */}
      {tailoredCV && (
        <TailoredCVModal
          isOpen={showCVModal}
          onClose={() => setShowCVModal(false)}
          candidate={candidate}
          job={job}
          tailoredCV={tailoredCV}
        />
      )}
    </div>
  );
}

