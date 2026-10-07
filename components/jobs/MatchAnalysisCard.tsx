"use client";

import React, { useState } from "react";
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
  Printer
} from "lucide-react";
import { generateTailoredCV, generateCoverLetter } from "@/lib/ai/matcher";
import { TailoredCVModal } from "@/components/cv/TailoredCVModal";

interface MatchAnalysisCardProps {
  job: JobListing;
  analysis: MatchAnalysisResult;
  candidate: CandidateProfile;
  onAddToTracker: (job: JobListing, score: number) => void;
}

export function MatchAnalysisCard({ 
  job, 
  analysis, 
  candidate,
  onAddToTracker 
}: MatchAnalysisCardProps) {
  const [tailoredCV, setTailoredCV] = useState<TailoredCVResult | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetterResult | null>(null);
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
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
      const res = await generateTailoredCV(candidate, job, analysis);
      setTailoredCV(res);
    } finally {
      setIsGeneratingCV(false);
    }
  };

  const handleCoverLetter = async () => {
    setIsGeneratingCL(true);
    try {
      const res = await generateCoverLetter(candidate, job);
      setCoverLetter(res);
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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8 transition-all hover:shadow-md">
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

          {/* Match Score Badge */}
          <div className="flex items-center sm:self-start md:self-auto gap-3">
            <div className={`flex flex-col items-center justify-center p-3.5 px-5 rounded-2xl border-2 ring-4 ${getScoreColor(analysis.score)}`}>
              <span className="text-3xl font-black tracking-tight">{analysis.score}%</span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                {analysis.recommendation.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Body */}
      <div className="p-6 sm:p-7 space-y-6">
        {/* Short Summary & Recommendation */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4">
          <p className="text-sm text-slate-700 leading-relaxed font-normal">
            <strong className="text-slate-900 font-semibold">Вердикт JobPilot: </strong>
            {analysis.summary}
          </p>
        </div>

        {/* Strengths and Gaps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Strengths */}
          <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3 text-emerald-800 font-semibold text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Твої сильні сторони під вакансію ({analysis.strengths.length})</span>
            </div>
            <ul className="space-y-2">
              {analysis.strengths.map((str, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-emerald-950 flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Missing Skills / Gaps */}
          <div className="bg-amber-50/40 border border-amber-200/70 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3 text-amber-800 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Зони уваги / чого не вистачає в CV ({analysis.missingSkills.length})</span>
            </div>
            {analysis.missingSkills.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missingSkills.map((sk, idx) => (
                    <span 
                      key={idx} 
                      className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-100/90 text-amber-900 border border-amber-300"
                    >
                      ⚠ {sk}
                    </span>
                  ))}
                </div>
                {analysis.experienceGaps.length > 0 && (
                  <p className="text-xs text-amber-900/80 leading-relaxed">
                    {analysis.experienceGaps[0]}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-600">Критичних прогалин у навичках не виявлено.</p>
            )}
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <button
            onClick={handleTailor}
            disabled={isGeneratingCV}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition shadow-xs active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGeneratingCV ? "Адаптую резюме..." : "Tailor My CV"}</span>
          </button>

          <button
            onClick={handleCoverLetter}
            disabled={isGeneratingCL}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition shadow-xs active:scale-[0.98] disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            <span>{isGeneratingCL ? "Пишу листа..." : "Write Cover Letter"}</span>
          </button>

          <button
            onClick={handleTrackerClick}
            disabled={isAddedToTracker}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
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
                <span>Зберегти в Tracker</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowFullJob(!showFullJob)}
            className="text-xs text-slate-500 hover:text-slate-800 ml-auto inline-flex items-center gap-1 py-1"
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
          <div className="mt-6 border border-blue-200 bg-blue-50/40 rounded-2xl p-5 space-y-4 animate-in fade-in">
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

            <div className="bg-white rounded-xl p-4 border border-blue-100 text-xs sm:text-sm space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Нове резюме (Summary):
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
          <div className="mt-6 border border-slate-300 bg-slate-50/70 rounded-2xl p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Супровідний лист (Cover Letter)</span>
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
                    <span>Скопіювати текст</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans">
              {coverLetter.content}
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

