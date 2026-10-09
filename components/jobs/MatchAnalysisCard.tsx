"use client";

import React, { useState, useRef } from "react";
import { 
  MatchAnalysisResult, 
  JobListing, 
  CandidateProfile, 
  TailoredCVResult, 
  CoverLetterResult,
  CoverLetterLength 
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
  Trash2,
  Target,
  Download,
  BadgeDollarSign,
  MessagesSquare
} from "lucide-react";
import { 
  generateTailoredCV, 
  generateCoverLetter,
  calculateSalaryInsights,
  generateOutreachKit 
} from "@/lib/ai/matcher";
import { TailoredCVModal } from "@/components/cv/TailoredCVModal";
import { scrollIntoCenter } from "@/lib/utils";
import { translations, Language } from "@/lib/translations";

interface MatchAnalysisCardProps {
  job: JobListing;
  analysis: MatchAnalysisResult;
  candidate: CandidateProfile;
  onAddToTracker: (
    job: JobListing,
    score: number,
    tailoredCV?: TailoredCVResult | null,
    coverLetter?: CoverLetterResult | null
  ) => void;
  onDeleteJob?: (jobId: string) => void;
  lang?: Language;
}

export function MatchAnalysisCard({ 
  job, 
  analysis, 
  candidate, 
  onAddToTracker,
  onDeleteJob,
  lang = "ua"
}: MatchAnalysisCardProps) {
  const t = translations[lang].matchCard;
  const tailoredCVRef = useRef<HTMLDivElement>(null);
  const coverLetterRef = useRef<HTMLDivElement>(null);
  const [tailoredCV, setTailoredCV] = useState<TailoredCVResult | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetterResult | null>(null);
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [clLang, setClLang] = useState<"en" | "ua">(lang === "en" ? "en" : "ua");
  const [clLength, setClLength] = useState<CoverLetterLength>("standard");
  const [copiedCL, setCopiedCL] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [isAddedToTracker, setIsAddedToTracker] = useState(false);
  const [showFullJob, setShowFullJob] = useState(false);
  const [showCVModal, setShowCVModal] = useState(false);

  // Level 3 state: Salary Insights & Outreach Kit
  const [copiedScriptIdx, setCopiedScriptIdx] = useState<number | null>(null);
  const [showSalaryDetails, setShowSalaryDetails] = useState(false);
  const [showOutreachKit, setShowOutreachKit] = useState(false);
  const [activeOutreachTab, setActiveOutreachTab] = useState<"djinni" | "followup" | "thankyou">("djinni");
  const [copiedOutreach, setCopiedOutreach] = useState(false);
  const outreachRef = useRef<HTMLDivElement>(null);

  const isEn = lang === "en";

  const salaryInsights = React.useMemo(() => {
    return calculateSalaryInsights(candidate, job, isEn);
  }, [candidate, job, isEn]);

  const outreachKit = React.useMemo(() => {
    return generateOutreachKit(candidate, job, isEn);
  }, [candidate, job, isEn]);

  const handleTailor = async () => {
    setIsGeneratingCV(true);
    try {
      const res = await generateTailoredCV(candidate, job, analysis, lang);
      setTailoredCV(res);
      if (isAddedToTracker) {
        onAddToTracker(job, analysis.score, res, coverLetter);
      }
      setTimeout(() => {
        scrollIntoCenter(tailoredCVRef.current);
      }, 100);
    } finally {
      setIsGeneratingCV(false);
    }
  };

  const handleCoverLetter = async (
    targetLang?: "en" | "ua",
    targetLength?: CoverLetterLength,
    shouldScroll: boolean = false
  ) => {
    const l = targetLang || clLang;
    const len = targetLength || clLength;
    setIsGeneratingCL(true);
    try {
      const res = await generateCoverLetter(candidate, job, l, len);
      setCoverLetter(res);
      setClLang(l);
      setClLength(len);
      if (isAddedToTracker) {
        onAddToTracker(job, analysis.score, tailoredCV, res);
      }
      if (shouldScroll) {
        setTimeout(() => {
          scrollIntoCenter(coverLetterRef.current);
        }, 100);
      }
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

  const handleDownloadTxt = () => {
    if (!coverLetter) return;
    const sanitizedName = candidate.fullName.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_");
    const sanitizedCompany = job.company.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_");
    const fileName = `Cover_Letter_${sanitizedName}_${sanitizedCompany}.txt`;

    const fileContent = [
      `${candidate.fullName} | ${candidate.title}`,
      `Vacancy: ${job.title} at ${job.company}`,
      coverLetter.subjectLine ? `Subject: ${coverLetter.subjectLine}` : "",
      "--------------------------------------------------",
      "",
      coverLetter.content
    ].filter(Boolean).join("\n");

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintCoverLetter = () => {
    if (!coverLetter) return;
    const printWindow = window.open("", "_blank", "width=850,height=1100");
    if (!printWindow) {
      window.print();
      return;
    }

    const documentTitle = `${candidate.fullName} - Cover Letter - ${job.company}`;
    const dateFormatted = new Date().toLocaleDateString(clLang === "ua" ? "uk-UA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="${clLang}">
<head>
  <meta charset="utf-8" />
  <title>${documentTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm 22mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      line-height: 1.6;
      font-size: 10pt;
      -webkit-font-smoothing: antialiased;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10pt;
      margin-bottom: 16pt;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .name {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 2pt 0;
      letter-spacing: -0.3px;
    }
    .title {
      font-size: 11pt;
      font-weight: 700;
      color: #2563eb;
      margin: 0;
    }
    .date {
      font-size: 9pt;
      color: #64748b;
      font-weight: 500;
    }
    .recipient-block {
      margin-bottom: 16pt;
      font-size: 9.5pt;
      color: #334155;
    }
    .recipient-role {
      font-weight: 700;
      color: #0f172a;
      font-size: 10.5pt;
    }
    .subject-block {
      background: #f8fafc;
      border-left: 3px solid #2563eb;
      padding: 7pt 10pt;
      margin-bottom: 16pt;
      font-weight: 600;
      font-size: 9.5pt;
      color: #0f172a;
    }
    .content {
      white-space: pre-line;
      color: #1e293b;
      font-size: 10pt;
      line-height: 1.65;
      text-align: justify;
    }
    .footer {
      margin-top: 36pt;
      padding-top: 8pt;
      border-top: 1px solid #e2e8f0;
      font-size: 8.5pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="name">${candidate.fullName}</div>
      <div class="title">${candidate.title}</div>
    </div>
    <div class="date">${dateFormatted}</div>
  </div>
  <div class="recipient-block">
    <div style="font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 2pt;">${clLang === "ua" ? "Подання на вакансію:" : "Application for:"}</div>
    <div class="recipient-role">${job.title}</div>
    <div>${job.company} • ${job.location}</div>
  </div>
  ${coverLetter.subjectLine ? `<div class="subject-block"><strong>${clLang === "ua" ? "Тема:" : "Subject:"}</strong> ${coverLetter.subjectLine}</div>` : ""}
  <div class="content">${coverLetter.content}</div>
  <div class="footer">
    <span>Prepared via JobPilot</span>
    <span>${job.company} — ${job.title}</span>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        window.onafterprint = function() {
          try { window.close(); } catch(e) {}
        };
      }, 250);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleTrackerClick = () => {
    onAddToTracker(job, analysis.score, tailoredCV, coverLetter);
    setIsAddedToTracker(true);
  };

  const getVerdictText = (score: number) => {
    if (score >= 85) return isEn ? "✓ Worth applying (Strong match)" : "✓ Рекомендовано подаватись (Високий збіг)";
    if (score >= 70) return isEn ? "⚡ Worth applying (Tailor CV recommended)" : "⚡ Рекомендовано подаватись (Адаптуйте резюме)";
    if (score >= 50) return isEn ? "⚠ Partial match (Gaps exist)" : "⚠ Помірна відповідність (Є прогалини)";
    return isEn ? "✕ Low match (Core stack mismatch)" : "✕ Низька відповідність (Невідповідність стеку)";
  };

  const getScreeningChances = (score: number) => {
    if (score >= 85) return isEn ? "High" : "Високі";
    if (score >= 70) return isEn ? "Moderate" : "Помірні";
    if (score >= 50) return isEn ? "Low" : "Низькі";
    return isEn ? "Very low" : "Дуже низькі";
  };

  return (
    <div id={`job-analysis-${job.id}`} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8 transition-all hover:shadow-md scroll-mt-24">
      {/* Header section */}
      <div className="p-6 sm:p-7 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {t.jobOpportunity}
              </span>
              {job.sourceUrl && (
                <a 
                  href={job.sourceUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 gap-1 font-medium"
                >
                  {t.openOriginal} <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {onDeleteJob && (
                <button
                  onClick={() => onDeleteJob(job.id)}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 px-2 py-0.5 rounded-md hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                  title={isEn ? "Remove vacancy" : "Видалити вакансію з аналізу"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.deleteJob}</span>
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

          {/* Premium Score Typography */}
          <div className="flex items-baseline md:flex-col md:items-end justify-between sm:self-start md:self-auto gap-1 bg-slate-50/80 px-5 py-3 rounded-2xl border border-slate-200/60">
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl sm:text-5xl font-black tracking-tighter tabular-nums ${
                analysis.score >= 85 ? "text-emerald-600" : analysis.score >= 70 ? "text-blue-600" : analysis.score >= 50 ? "text-amber-600" : "text-rose-600"
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
        {/* Core Verdict Box */}
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
                  : analysis.score >= 50
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-rose-100 text-rose-800 border-rose-300"
              }`}>
                {getVerdictText(analysis.score)}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {isEn ? "Screening pass rate: " : "Шанси пройти скринінг: "}
              <strong className="text-slate-800">{getScreeningChances(analysis.score)}</strong>
            </span>
          </div>

          {/* Critical Gaps / Concerns */}
          {analysis.missingSkills.length > 0 && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                ⚠️ {isEn ? "Primary Risk Factor:" : "Головний ризик відмови (Biggest Concern):"}
              </span>
              <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-normal">
                {analysis.experienceGaps[0] || (isEn 
                  ? `Vacancy requires experience in ${analysis.missingSkills.slice(0, 2).join(", ")}, which is missing from your profile.` 
                  : `Вакансія вимагає досвід з ${analysis.missingSkills.slice(0, 2).join(", ")}, що недостатньо підтверджено у вашому поточному резюме.`)}
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
                {t.strengthsTitle}
              </span>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                {analysis.strengths.length} {isEn ? "points" : "пунктів"}
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
                {t.missingSkillsTitle}
              </span>
              <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                {analysis.missingSkills.length} {t.skillsCount}
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
                  {t.missingSkillsSub}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">{t.noGaps}</p>
            )}
          </div>
        </div>

        {/* AI Interview Prep (Cheat Sheet) */}
        {analysis.interviewQuestions && analysis.interviewQuestions.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 border border-indigo-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/90 pb-3">
              <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>{t.interviewPrepTitle}</span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-full border border-indigo-200 self-start sm:self-auto">
                {analysis.interviewQuestions.length} {isEn ? "Targeted Questions" : "Ключових питань"}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-normal">
              {t.interviewPrepSubtitle}
            </p>

            <div className="space-y-3 pt-1">
              {analysis.interviewQuestions.map((q, idx) => (
                <div key={q.id || idx} className="bg-white rounded-xl p-4 border border-indigo-100/90 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Q{idx + 1} • {q.category.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {q.question}
                      </h4>
                    </div>

                    <button
                      onClick={() => {
                        const copyText = `${q.question}\n\nContext: ${q.context}\nTalking Points:\n${q.talkingPoints.map(p => `• ${p}`).join('\n')}`;
                        navigator.clipboard.writeText(copyText);
                        setCopiedQuestionId(q.id || String(idx));
                        setTimeout(() => setCopiedQuestionId(null), 2000);
                      }}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 shrink-0 p-1.5 rounded-lg hover:bg-indigo-50 transition border border-indigo-100 bg-white"
                      title={t.copyQuestion}
                    >
                      {copiedQuestionId === (q.id || String(idx)) ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {copiedQuestionId === (q.id || String(idx)) ? t.copiedQuestion : t.copyQuestion}
                      </span>
                    </button>
                  </div>

                  {q.context && (
                    <div className="text-xs bg-slate-50 text-slate-600 p-2.5 rounded-lg border border-slate-100">
                      <strong className="text-slate-800 text-[11px] uppercase tracking-wider block mb-0.5">
                        {t.whyTheyAsk}
                      </strong>
                      <span>{q.context}</span>
                    </div>
                  )}

                  {q.talkingPoints && q.talkingPoints.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                        {t.talkingPointsLabel}
                      </span>
                      <ul className="text-xs text-slate-700 space-y-1">
                        {q.talkingPoints.map((pt, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Salary Insights & Negotiation Copilot */}
        <div className="bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 border border-emerald-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
              <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
              <span>{t.salaryInsightsTitle}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {t.salaryEstimateBadge}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-normal">
            {t.salaryInsightsSubtitle}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vacancy Stated vs Calculated (Priority to Employer Offer) */}
            <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-2xs space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {t.statedSalary}
              </span>
              {job.salary ? (
                <div className="text-xl font-extrabold text-emerald-700">
                  {job.salary}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic pt-1">
                  {t.unspecifiedSalary}
                </div>
              )}
              <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                {salaryInsights.factors.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Range Card */}
            <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-2xs space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {t.marketBracketLabel}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  ${salaryInsights.estimatedMin.toLocaleString()} – ${salaryInsights.estimatedMax.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-500">{t.perMonth}</span>
              </div>
              <div className="text-xs text-slate-600 pt-1">
                <strong>{t.marketMedianLabel}</strong>{" "}
                <span className="text-emerald-700 font-bold">${salaryInsights.median.toLocaleString()}</span> {t.perMonth}
              </div>
            </div>
          </div>

          {/* Transparent source disclaimer */}
          <p className="text-[11px] text-slate-400 italic">
            💡 {t.salaryDisclaimer}
          </p>

          {/* Toggle Negotiation Scripts */}
          <div className="pt-2">
            <button
              onClick={() => setShowSalaryDetails(!showSalaryDetails)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
            >
              <span>{showSalaryDetails ? (isEn ? "Hide Negotiation Scripts" : "Приховати скрипти перемовин") : (isEn ? "Show Negotiation Scripts with HR" : "Показати скрипти для перемовин з HR")}</span>
              {showSalaryDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSalaryDetails && (
              <div className="mt-3 space-y-3 animate-in fade-in">
                <span className="text-xs font-bold text-slate-800 block">
                  {t.negotiationTitle}
                </span>
                {salaryInsights.negotiationTips.map((tip, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-3.5 border border-emerald-100 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{tip.title}</h5>
                        <p className="text-[11px] text-slate-500">{tip.context}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(tip.script);
                          setCopiedScriptIdx(idx);
                          setTimeout(() => setCopiedScriptIdx(null), 2000);
                        }}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition"
                      >
                        {copiedScriptIdx === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedScriptIdx === idx ? t.copiedScript : t.copyScript}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-sans">
                      "{tip.script}"
                    </p>
                  </div>
                ))}
              </div>
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
            <span>{isGeneratingCV ? t.tailoringCv : t.tailorCvBtn}</span>
          </button>

          <button
            onClick={() => handleCoverLetter(undefined, undefined, true)}
            disabled={isGeneratingCL}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition active:scale-[0.98] disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            <span>{isGeneratingCL ? t.writingCl : t.writeClBtn}</span>
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
                <span>{t.trackedBtn}</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4 text-slate-500" />
                <span>{t.trackBtn}</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setShowOutreachKit(!showOutreachKit);
              if (!showOutreachKit) {
                setTimeout(() => scrollIntoCenter(outreachRef.current), 100);
              }
            }}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition active:scale-[0.98] ${
              showOutreachKit
                ? "bg-purple-100 text-purple-900 border-purple-300 shadow-xs"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <MessagesSquare className="w-4 h-4 text-purple-600" />
            <span>{t.outreachKitTitle.split('(')[0].trim()}</span>
          </button>

          <button
            onClick={() => setShowFullJob(!showFullJob)}
            className="text-xs text-slate-400 hover:text-slate-700 ml-auto inline-flex items-center gap-1 py-1"
          >
            {showFullJob ? t.hideDescription : t.fullDescription}
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
          <div ref={tailoredCVRef} className="mt-6 border border-blue-200 bg-blue-50/40 rounded-2xl p-5 space-y-4 animate-in fade-in scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <FileEdit className="w-4 h-4 text-blue-600" />
                <span>{t.tailoredCvTitle} {job.company}</span>
                <span className="text-[11px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                  ATS-Optimized
                </span>
              </div>
              <button
                onClick={() => setShowCVModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-2xs self-start sm:self-auto"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.openPdfModal}</span>
              </button>
            </div>

            {/* What Changed Transparency Box */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  {t.transparencyTitle}
                </span>
                {tailoredCV.atsKeywordsAdded.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">{isEn ? "Targeted ATS Keywords:" : "Інтегровані ATS-ключі:"}</span>
                    {tailoredCV.atsKeywordsAdded.map((kw, i) => (
                      <span key={i} className="text-[10px] font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ul className="text-xs text-emerald-950 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{t.change1}: <strong className="text-emerald-900">{tailoredCV.highlightedSkills.slice(0, 3).join(", ")}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{t.change2} <strong>{job.company}</strong> ({job.title})</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{t.change3}</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-4 border border-blue-100 text-xs sm:text-sm space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  {t.summaryBlock}
                </span>
                <p className="text-slate-800 mt-1 font-medium leading-relaxed">
                  {tailoredCV.tailoredSummary}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  {t.skillsBlock}
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
                  {t.expBlock}
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
          <div ref={coverLetterRef} className="mt-6 border border-slate-300 bg-slate-50/70 rounded-2xl p-5 space-y-4 animate-in fade-in scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>{t.coverLetterTitle}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Language Toggle */}
                <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 text-xs font-semibold">
                  <button
                    onClick={() => handleCoverLetter("en", undefined, false)}
                    disabled={isGeneratingCL}
                    className={`px-2.5 py-1 rounded transition ${
                      clLang === "en" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    onClick={() => handleCoverLetter("ua", undefined, false)}
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100 transition shadow-2xs"
                >
                  {copiedCL ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCL ? t.copied : t.copyLetter}</span>
                </button>

                <button
                  onClick={handleDownloadTxt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100 transition shadow-2xs"
                  title={isEn ? "Download as .txt" : "Завантажити у форматі .txt"}
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>{t.downloadTxt}</span>
                </button>

                <button
                  onClick={handlePrintCoverLetter}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition shadow-2xs"
                  title={isEn ? "Print or Save as PDF" : "Друкувати або зберегти як PDF"}
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t.printPdf}</span>
                </button>
              </div>
            </div>

            {/* Length Selector & Live Character Counter */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-200/60">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <button
                  onClick={() => handleCoverLetter(undefined, "short", false)}
                  disabled={isGeneratingCL}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    clLength === "short"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {t.clLengthShort}
                </button>
                <button
                  onClick={() => handleCoverLetter(undefined, "standard", false)}
                  disabled={isGeneratingCL}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    clLength === "standard"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {t.clLengthStandard}
                </button>
                <button
                  onClick={() => handleCoverLetter(undefined, "full", false)}
                  disabled={isGeneratingCL}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    clLength === "full"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {t.clLengthFull}
                </button>
              </div>

              {/* Live Character & Word Count */}
              <div className="text-[11px] font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-slate-900 font-bold tabular-nums">{coverLetter.content.length}</span>
                <span>{t.charCountLabel}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-900 font-bold tabular-nums">{coverLetter.content.trim().split(/\s+/).filter(Boolean).length}</span>
                <span>{t.wordCountLabel}</span>
              </div>
            </div>

            {coverLetter.subjectLine && (
              <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    {t.subjectLineLabel}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate select-all">
                    {coverLetter.subjectLine}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(coverLetter.subjectLine);
                    setCopiedSubject(true);
                    setTimeout(() => setCopiedSubject(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 transition shrink-0 self-start sm:self-auto"
                >
                  {copiedSubject ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSubject ? t.copiedSubject : t.copySubject}</span>
                </button>
              </div>
            )}

            <div className="bg-white p-5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans shadow-2xs">
              {coverLetter.content}
            </div>
          </div>
        )}

        {/* Generated Outreach Kit Panel */}
        {showOutreachKit && (
          <div ref={outreachRef} className="mt-6 border border-purple-200 bg-purple-50/40 rounded-2xl p-5 space-y-4 animate-in fade-in scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-purple-950 font-bold text-sm">
                <MessagesSquare className="w-4 h-4 text-purple-600" />
                <span>{t.outreachKitTitle}</span>
              </div>

              <button
                onClick={() => {
                  const currentText = 
                    activeOutreachTab === "djinni" ? outreachKit.djinniLinkedInIntro :
                    activeOutreachTab === "followup" ? outreachKit.followUpMessage :
                    outreachKit.thankYouNote;
                  navigator.clipboard.writeText(currentText);
                  setCopiedOutreach(true);
                  setTimeout(() => setCopiedOutreach(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-900 text-xs font-semibold hover:bg-purple-100 transition shadow-2xs"
              >
                {copiedOutreach ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedOutreach ? t.copiedMessage : t.copyMessage}</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {t.outreachKitSubtitle}
            </p>

            {/* Outreach Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-purple-100 shadow-2xs">
              <button
                onClick={() => setActiveOutreachTab("djinni")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeOutreachTab === "djinni"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {t.outreachDjinniTab}
              </button>
              <button
                onClick={() => setActiveOutreachTab("followup")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeOutreachTab === "followup"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {t.outreachFollowUpTab}
              </button>
              <button
                onClick={() => setActiveOutreachTab("thankyou")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeOutreachTab === "thankyou"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {t.outreachThankYouTab}
              </button>
            </div>

            {/* Message Box */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-purple-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans shadow-2xs relative">
              <div className="absolute top-3 right-3 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                {(activeOutreachTab === "djinni" ? outreachKit.djinniLinkedInIntro :
                  activeOutreachTab === "followup" ? outreachKit.followUpMessage :
                  outreachKit.thankYouNote).length} {t.charCountLabel}
              </div>
              <p className="whitespace-pre-line pr-16 font-sans leading-relaxed">
                {activeOutreachTab === "djinni" ? outreachKit.djinniLinkedInIntro :
                 activeOutreachTab === "followup" ? outreachKit.followUpMessage :
                 outreachKit.thankYouNote}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tailored CV Modal */}
      {showCVModal && tailoredCV && (
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
