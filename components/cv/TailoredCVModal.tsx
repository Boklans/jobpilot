"use client";

import React, { useRef, useState } from "react";
import { CandidateProfile, JobListing, TailoredCVResult } from "@/types";
import { Download, Printer, X, Check, Copy, Sparkles, FileText, Globe } from "lucide-react";

interface TailoredCVModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateProfile;
  job: JobListing;
  tailoredCV: TailoredCVResult;
}

export function TailoredCVModal({
  isOpen,
  onClose,
  candidate,
  job,
  tailoredCV,
}: TailoredCVModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState<"en" | "ua">("en");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Plain text representation for 1-click clipboard copy
  const getCvPlainText = () => {
    const isEn = lang === "en";
    const headerTitle = isEn ? "PROFESSIONAL SUMMARY" : "ПРОФЕСІЙНИЙ ПІДСУМОК";
    const skillsTitle = isEn ? "TECHNICAL SKILLS & COMPETENCIES" : "ТЕХНІЧНІ НАВИЧКИ ТА КОМПЕТЕНЦІЇ";
    const expTitle = isEn ? "PROFESSIONAL EXPERIENCE" : "ДОСВІД РОБОТИ";

    return `${candidate.fullName}
${candidate.title} | ${candidate.yearsOfExperience}+ ${isEn ? "years of experience" : "років досвіду"}

${headerTitle}
${tailoredCV.tailoredSummary}

${skillsTitle}
${tailoredCV.highlightedSkills.join(" · ")}

${expTitle}
${tailoredCV.optimizedExperiences
  .map(
    (exp) => `${exp.position} | ${exp.company}
${exp.bullets.map((b) => `• ${b}`).join("\n")}`
  )
  .join("\n\n")}`;
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(getCvPlainText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy CV:", err);
    }
  };

  const handleDownloadDoc = () => {
    const isEn = lang === "en";
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${candidate.fullName} - CV</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.35; color: #111; }
          h1 { font-size: 20pt; margin: 0 0 4pt 0; color: #111; }
          .subtitle { font-size: 12pt; font-weight: bold; color: #1e3a8a; margin-bottom: 12pt; }
          h2 { font-size: 11pt; font-weight: bold; text-transform: uppercase; border-bottom: 1.5pt solid #111; margin-top: 14pt; margin-bottom: 6pt; letter-spacing: 0.5pt; }
          .job-title { font-weight: bold; font-size: 11pt; margin-top: 8pt; margin-bottom: 2pt; }
          ul { margin-top: 2pt; margin-bottom: 6pt; padding-left: 18pt; }
          li { margin-bottom: 2pt; }
          .skills { margin-bottom: 8pt; }
        </style>
      </head>
      <body>
        <h1>${candidate.fullName}</h1>
        <div class="subtitle">${candidate.title} · ${candidate.yearsOfExperience}+ ${isEn ? "years of experience" : "років досвіду"}</div>

        <h2>${isEn ? "Professional Summary" : "Професійний підсумок"}</h2>
        <p>${tailoredCV.tailoredSummary}</p>

        <h2>${isEn ? "Technical Skills" : "Технічні навички"}</h2>
        <p class="skills">${tailoredCV.highlightedSkills.join(" · ")}</p>

        <h2>${isEn ? "Professional Experience" : "Досвід роботи"}</h2>
        ${tailoredCV.optimizedExperiences
          .map(
            (exp) => `
          <div class="job-title">${exp.position} | ${exp.company}</div>
          <ul>
            ${exp.bullets.map((b) => `<li>${b}</li>`).join("")}
          </ul>
        `
          )
          .join("")}
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", content], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidate.fullName.replace(/\s+/g, "_")}_CV.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isEn = lang === "en";

  return (
    <div className="cv-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="cv-modal-card bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Modal Top Toolbar (Not included in print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                {candidate.fullName} · {candidate.title}
              </h3>
              <p className="text-xs text-slate-500">
                {isEn ? "Tailored for position:" : "Адаптовано під посаду:"} {job.title}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 text-xs font-semibold">
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  lang === "en" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🇬🇧 EN
              </button>
              <button
                onClick={() => setLang("ua")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  lang === "ua" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🇺🇦 UA
              </button>
            </div>

            {/* Copy Text */}
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition shadow-2xs active:scale-95"
              title="Скопіювати текст резюме"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (isEn ? "Copied!" : "Скопійовано!") : (isEn ? "Copy text" : "Копіювати")}</span>
            </button>

            {/* Download Word Doc */}
            <button
              onClick={handleDownloadDoc}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition shadow-2xs active:scale-95"
              title="Завантажити у форматі Word (.doc)"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>{isEn ? "Download .doc" : "Зберегти Word"}</span>
            </button>

            {/* Save as PDF */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs active:scale-95"
              title="Зберегти як PDF файл"
            >
              <Download className="w-4 h-4" />
              <span>{isEn ? "Save as PDF" : "Зберегти як PDF"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              title="Закрити"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CV Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">
          <div 
            ref={printAreaRef}
            id="cv-printable-area"
            className="max-w-[794px] mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-md border border-slate-200/80 print:shadow-none print:border-none print:p-0 print:max-w-none text-slate-900 font-sans"
          >
            {/* Header / Contact */}
            <div className="border-b-2 border-slate-900 pb-4 mb-5 text-left flex justify-between items-baseline flex-wrap gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {candidate.fullName}
                </h1>
                <p className="text-sm font-semibold text-blue-700 mt-0.5">
                  {candidate.title}
                </p>
              </div>
              <div className="text-xs text-slate-600 text-right">
                <p className="font-medium">
                  {candidate.yearsOfExperience}+ {isEn ? "years commercial experience" : "років комерційного досвіду"}
                </p>
                <p className="text-slate-500">Ukraine · Open for Opportunities</p>
              </div>
            </div>

            {/* Professional Summary */}
            <div className="mb-5 cv-section">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2">
                {isEn ? "Professional Summary" : "Професійний підсумок"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {tailoredCV.tailoredSummary}
              </p>
            </div>

            {/* Core Competencies & Skills */}
            <div className="mb-5 cv-section">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2.5">
                {isEn ? "Technical Skills & Competencies" : "Технічні навички та компетенції"}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {tailoredCV.highlightedSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 print:border print:border-slate-300"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience Section */}
            <div className="mb-4 cv-section">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-3">
                {isEn ? "Professional Experience" : "Досвід роботи"}
              </h2>
              <div className="space-y-4">
                {tailoredCV.optimizedExperiences.map((exp, idx) => (
                  <div key={idx} className="space-y-1.5 cv-section">
                    <div className="flex justify-between items-baseline flex-wrap gap-1">
                      <h3 className="text-sm font-bold text-slate-900">
                        {exp.position} <span className="text-slate-500 font-normal">| {exp.company}</span>
                      </h3>
                    </div>
                    <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-slate-700 leading-relaxed">
                      {exp.bullets.map((bullet, bi) => (
                        <li key={bi}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
