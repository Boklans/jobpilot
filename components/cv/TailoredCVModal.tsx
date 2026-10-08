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
    const isEn = lang === "en";
    const printWindow = window.open("", "_blank", "width=850,height=1100");
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title>${candidate.fullName} — Resume</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      line-height: 1.45;
      font-size: 10pt;
    }
    h1 {
      font-size: 22pt;
      margin: 0 0 2pt 0;
      color: #0f172a;
      font-weight: 800;
      letter-spacing: -0.4px;
    }
    .subtitle {
      font-size: 11.5pt;
      font-weight: 700;
      color: #2563eb;
      margin: 0;
    }
    .meta {
      font-size: 9pt;
      color: #475569;
      text-align: right;
      line-height: 1.4;
    }
    .header-bar {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 7pt;
      margin-bottom: 10pt;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    h2 {
      font-size: 10.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 3pt;
      margin-top: 12pt;
      margin-bottom: 6pt;
      color: #0f172a;
    }
    p {
      margin: 0 0 5pt 0;
      text-align: justify;
      font-size: 9.5pt;
      line-height: 1.45;
      color: #334155;
    }
    .skills-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 4pt;
      margin-bottom: 8pt;
    }
    .skill-pill {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 2.5pt 6.5pt;
      border-radius: 4pt;
      font-size: 8.5pt;
      font-weight: 600;
      color: #1e293b;
    }
    .exp-item {
      margin-bottom: 9pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .exp-header-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2pt;
    }
    .exp-position {
      font-weight: 700;
      font-size: 10.5pt;
      color: #0f172a;
    }
    .exp-company {
      font-weight: 500;
      font-size: 10pt;
      color: #475569;
    }
    .exp-period {
      font-weight: 600;
      font-size: 9pt;
      color: #64748b;
      text-align: right;
      white-space: nowrap;
    }
    ul {
      margin: 2.5pt 0 5pt 0;
      padding-left: 14pt;
    }
    li {
      margin-bottom: 2pt;
      font-size: 9.2pt;
      color: #334155;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div>
      <h1>${candidate.fullName}</h1>
      <div class="subtitle">${candidate.title}</div>
    </div>
    <div class="meta">
      <div><strong>${candidate.yearsOfExperience}+ ${isEn ? "years of experience" : "років досвіду"}</strong></div>
      <div>Ukraine · Available Immediately</div>
    </div>
  </div>

  <h2>${isEn ? "Professional Summary" : "Професійний підсумок"}</h2>
  <p>${tailoredCV.tailoredSummary}</p>

  <h2>${isEn ? "Technical Skills & Competencies" : "Технічні навички"}</h2>
  <div class="skills-wrap">
    ${tailoredCV.highlightedSkills.map((s) => `<span class="skill-pill">${s}</span>`).join("")}
  </div>

  <h2>${isEn ? "Professional Experience" : "Досвід роботи"}</h2>
  ${tailoredCV.optimizedExperiences
    .map((exp, idx) => {
      const period = exp.period || candidate.experiences.find((e) => e.company.toLowerCase() === exp.company.toLowerCase())?.period || candidate.experiences[idx]?.period || "";
      return `
    <div class="exp-item">
      <div class="exp-header-row">
        <div>
          <span class="exp-position">${exp.position}</span>
          <span class="exp-company"> | ${exp.company}</span>
        </div>
        ${period ? `<div class="exp-period">${period}</div>` : ""}
      </div>
      <ul>
        ${exp.bullets.map((b) => `<li>${b}</li>`).join("")}
      </ul>
    </div>
  `;
    })
    .join("")}

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
        window.onafterprint = function() {
          try { window.close(); } catch(e) {}
        };
      }, 200);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
  .map((exp, idx) => {
    const period = exp.period || candidate.experiences.find((e) => e.company.toLowerCase() === exp.company.toLowerCase())?.period || candidate.experiences[idx]?.period || "";
    return `${exp.position} | ${exp.company} ${period ? `(${period})` : ""}
${exp.bullets.map((b) => `• ${b}`).join("\n")}`;
  })
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
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #111; }
          h1 { font-size: 22pt; margin: 0 0 3pt 0; color: #111; }
          .subtitle { font-size: 12pt; font-weight: bold; color: #1e3a8a; margin-bottom: 12pt; }
          h2 { font-size: 11.5pt; font-weight: bold; text-transform: uppercase; border-bottom: 1.5pt solid #111; margin-top: 14pt; margin-bottom: 6pt; letter-spacing: 0.5pt; }
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
          .map((exp, idx) => {
            const period = exp.period || candidate.experiences.find((e) => e.company.toLowerCase() === exp.company.toLowerCase())?.period || candidate.experiences[idx]?.period || "";
            return `
          <div class="job-title" style="display:flex; justify-content:space-between;">
            <span>${exp.position} | ${exp.company}</span>
            <span style="font-weight:normal; color:#666;">${period}</span>
          </div>
          <ul>
            ${exp.bullets.map((b) => `<li>${b}</li>`).join("")}
          </ul>
        `;
          })
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

        {/* Quick Hint for Windows Print-to-PDF */}
        <div className="px-5 py-2 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-[11px] text-blue-900 print:hidden">
          <span className="flex items-center gap-1.5 font-medium">
            💡 <strong>Порада:</strong> У вікні виберіть <em>«Microsoft Print to PDF»</em> (або <em>«Зберегти як PDF»</em>) і натисніть кнопку <strong>«Друк»</strong> — файл збережеться як .pdf.
          </span>
          <span className="hidden sm:inline text-blue-700/80">
            Або тисніть <strong>«Зберегти Word»</strong> для миттєвого завантаження файлу
          </span>
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
                {tailoredCV.optimizedExperiences.map((exp, idx) => {
                  const period = exp.period || candidate.experiences.find((e) => e.company.toLowerCase() === exp.company.toLowerCase())?.period || candidate.experiences[idx]?.period || "";
                  return (
                    <div key={idx} className="space-y-1.5 cv-section">
                      <div className="flex justify-between items-baseline flex-wrap gap-1">
                        <h3 className="text-sm font-bold text-slate-900">
                          {exp.position} <span className="text-slate-500 font-normal">| {exp.company}</span>
                        </h3>
                        {period && (
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                            {period}
                          </span>
                        )}
                      </div>
                      <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-slate-700 leading-relaxed">
                        {exp.bullets.map((bullet, bi) => (
                          <li key={bi}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
