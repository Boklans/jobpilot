"use client";

import React, { useRef, useState } from "react";
import { CandidateProfile, JobListing, TailoredCVResult } from "@/types";
import { Download, X, Check, Copy, Sparkles, FileText, Code2, Briefcase, FileCode } from "lucide-react";

interface TailoredCVModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateProfile;
  job: JobListing;
  tailoredCV: TailoredCVResult;
}

type CVStyle = "silicon" | "modern" | "minimal";

export function TailoredCVModal({
  isOpen,
  onClose,
  candidate,
  job,
  tailoredCV,
}: TailoredCVModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState<"en" | "ua">("en");
  const [cvStyle, setCvStyle] = useState<CVStyle>("silicon");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const cleanName = candidate.fullName.trim();
  const cleanTitle = candidate.title.trim();
  const isEn = lang === "en";

  const getStyleCSS = (style: CVStyle) => {
    if (style === "silicon") {
      return `
        body {
          font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 14mm 16mm;
          line-height: 1.45;
          font-size: 9.5pt;
          font-weight: 400;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: geometricPrecision;
        }
        h1 {
          font-size: 21pt;
          margin: 0 0 2pt 0;
          color: #0f172a;
          font-weight: 800;
          letter-spacing: -0.3px;
        }
        .subtitle {
          font-size: 11pt;
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
          padding-bottom: 6pt;
          margin-bottom: 10pt;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        h2 {
          font-size: 10pt;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          border-bottom: 1.5px solid #2563eb;
          padding-bottom: 2.5pt;
          margin-top: 11pt;
          margin-bottom: 5pt;
          color: #0f172a;
        }
        p {
          margin: 0 0 5pt 0;
          text-align: justify;
          font-size: 9.5pt;
          line-height: 1.45;
          color: #334155;
          font-weight: 400;
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
          padding: 2pt 6pt;
          border-radius: 3pt;
          font-size: 8.5pt;
          font-weight: 600;
          color: #0f172a;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace, Arial;
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
          font-weight: 600;
          font-size: 10pt;
          color: #2563eb;
        }
        .exp-period {
          font-weight: 600;
          font-size: 8.5pt;
          color: #475569;
          text-align: right;
          background: #f1f5f9;
          padding: 1.5pt 5pt;
          border-radius: 3pt;
          white-space: nowrap;
        }
        ul {
          margin: 2.5pt 0 5pt 0;
          padding-left: 14pt;
        }
        li {
          margin-bottom: 2.5pt;
          font-size: 9pt;
          color: #334155;
          line-height: 1.42;
          font-weight: 400;
        }
      `;
    }

    if (style === "modern") {
      return `
        body {
          font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 14mm 16mm;
          line-height: 1.45;
          font-size: 9.5pt;
          font-weight: 400;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: geometricPrecision;
        }
        h1 {
          font-size: 22pt;
          margin: 0 0 2pt 0;
          color: #0f172a;
          font-weight: 800;
          letter-spacing: -0.2px;
        }
        .subtitle {
          font-size: 11pt;
          font-weight: 700;
          color: #1e3a8a;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin: 0;
        }
        .meta {
          font-size: 9pt;
          color: #475569;
          text-align: right;
          line-height: 1.4;
        }
        .header-bar {
          border-bottom: 2.5px solid #1e3a8a;
          padding-bottom: 7pt;
          margin-bottom: 11pt;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        h2 {
          font-size: 10.5pt;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-bottom: 1.5px solid #1e3a8a;
          padding-bottom: 2.5pt;
          margin-top: 12pt;
          margin-bottom: 6pt;
          color: #1e3a8a;
        }
        p {
          margin: 0 0 5pt 0;
          text-align: justify;
          font-size: 9.5pt;
          line-height: 1.45;
          color: #1e293b;
          font-weight: 400;
        }
        .skills-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 4pt;
          margin-bottom: 8pt;
        }
        .skill-pill {
          background: #ffffff;
          border: 1px solid #94a3b8;
          padding: 2pt 6pt;
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
          font-style: italic;
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
          margin-bottom: 2.5pt;
          font-size: 9pt;
          color: #1e293b;
          line-height: 1.42;
          font-weight: 400;
        }
      `;
    }

    // minimal / ATS classic
    return `
      body {
        font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
        color: #111827;
        background: #ffffff;
        margin: 0;
        padding: 14mm 16mm;
        line-height: 1.45;
        font-size: 9.5pt;
        font-weight: 400;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: geometricPrecision;
      }
      h1 {
        font-size: 20pt;
        margin: 0 0 2pt 0;
        color: #111827;
        font-weight: 800;
      }
      .subtitle {
        font-size: 10.5pt;
        font-weight: 600;
        color: #374151;
        margin: 0;
      }
      .meta {
        font-size: 9pt;
        color: #4b5563;
        text-align: right;
        line-height: 1.4;
      }
      .header-bar {
        border-bottom: 1px solid #111827;
        padding-bottom: 5pt;
        margin-bottom: 9pt;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }
      h2 {
        font-size: 9.5pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #111827;
        padding-bottom: 2pt;
        margin-top: 10pt;
        margin-bottom: 5pt;
        color: #111827;
      }
      p {
        margin: 0 0 5pt 0;
        text-align: justify;
        font-size: 9.5pt;
        line-height: 1.45;
        color: #374151;
        font-weight: 400;
      }
      .skills-wrap {
        font-size: 9pt;
        color: #1f2937;
        line-height: 1.45;
        margin-bottom: 6pt;
        font-weight: 500;
      }
      .exp-item {
        margin-bottom: 8pt;
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
        font-size: 10pt;
        color: #111827;
      }
      .exp-company {
        font-weight: 400;
        font-size: 9.5pt;
        color: #4b5563;
      }
      .exp-period {
        font-weight: 500;
        font-size: 8.5pt;
        color: #4b5563;
        text-align: right;
        white-space: nowrap;
      }
      ul {
        margin: 2.5pt 0 5pt 0;
        padding-left: 14pt;
      }
      li {
        margin-bottom: 2pt;
        font-size: 9pt;
        color: #374151;
        line-height: 1.4;
        font-weight: 400;
      }
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=850,height=1100");
    if (!printWindow) {
      window.print();
      return;
    }

    const documentTitle = `${cleanName} - ${cleanTitle}`;
    const skillsHtml =
      cvStyle === "minimal"
        ? `<div class="skills-wrap">${tailoredCV.highlightedSkills.join(" · ")}</div>`
        : `<div class="skills-wrap">${tailoredCV.highlightedSkills.map((s) => `<span class="skill-pill">${s}</span>`).join("")}</div>`;

    const htmlContent = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title>${documentTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    ${getStyleCSS(cvStyle)}
  </style>
</head>
<body>
  <div class="header-bar">
    <div>
      <h1>${cleanName}</h1>
      <div class="subtitle">${cleanTitle}</div>
    </div>
    <div class="meta">
      <div><strong>${candidate.yearsOfExperience}+ ${isEn ? "years of experience" : "років досвіду"}</strong></div>
      <div>Ukraine · Available Immediately</div>
    </div>
  </div>

  <h2>${isEn ? "Professional Summary" : "Професійний підсумок"}</h2>
  <p>${tailoredCV.tailoredSummary}</p>

  <h2>${isEn ? "Technical Skills & Competencies" : "Технічні навички"}</h2>
  ${skillsHtml}

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
    const headerTitle = isEn ? "PROFESSIONAL SUMMARY" : "ПРОФЕСІЙНИЙ ПІДСУМОК";
    const skillsTitle = isEn ? "TECHNICAL SKILLS & COMPETENCIES" : "ТЕХНІЧНІ НАВИЧКИ ТА КОМПЕТЕНЦІЇ";
    const expTitle = isEn ? "PROFESSIONAL EXPERIENCE" : "ДОСВІД РОБОТИ";

    return `${cleanName}
${cleanTitle} | ${candidate.yearsOfExperience}+ ${isEn ? "years of experience" : "років досвіду"}

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
    const cleanFilename = `${cleanName.replace(/\s+/g, "_")}_${cleanTitle.replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, "_")}.doc`;

    const accentColor = cvStyle === "silicon" ? "#2563eb" : cvStyle === "modern" ? "#1e3a8a" : "#111827";
    const skillsFormatted =
      cvStyle === "minimal"
        ? tailoredCV.highlightedSkills.join(" · ")
        : tailoredCV.highlightedSkills.map((s) => `[${s}]`).join("  ");

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${cleanName} - ${cleanTitle}</title>
        <style>
          body { font-family: Arial, Calibri, sans-serif; font-size: 10pt; line-height: 1.45; color: #111; }
          h1 { font-size: 21pt; margin: 0 0 3pt 0; color: #0f172a; font-weight: bold; }
          .subtitle { font-size: 11pt; font-weight: bold; color: ${accentColor}; margin-bottom: 12pt; }
          h2 { font-size: 10.5pt; font-weight: bold; text-transform: uppercase; border-bottom: 1.5pt solid ${accentColor}; margin-top: 14pt; margin-bottom: 6pt; letter-spacing: 0.5pt; color: #0f172a; }
          .job-title { font-weight: bold; font-size: 10.5pt; margin-top: 8pt; margin-bottom: 2pt; }
          ul { margin-top: 2pt; margin-bottom: 6pt; padding-left: 18pt; }
          li { margin-bottom: 2pt; font-size: 9.5pt; }
          .skills { margin-bottom: 8pt; font-size: 9.5pt; }
        </style>
      </head>
      <body>
        <h1>${cleanName}</h1>
        <div class="subtitle">${cleanTitle} · ${candidate.yearsOfExperience}+ ${isEn ? "years of experience" : "років досвіду"}</div>

        <h2>${isEn ? "Professional Summary" : "Професійний підсумок"}</h2>
        <p>${tailoredCV.tailoredSummary}</p>

        <h2>${isEn ? "Technical Skills" : "Технічні навички"}</h2>
        <p class="skills">${skillsFormatted}</p>

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
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cv-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="cv-modal-card bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Modal Top Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                {cleanName} · {cleanTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {isEn ? "Tailored for position:" : "Адаптовано під вакансію:"} {job.title} ({job.company})
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Developer CV Style Switcher */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 text-xs font-semibold shadow-2xs">
              <button
                onClick={() => setCvStyle("silicon")}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  cvStyle === "silicon"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Стиль Silicon Valley / Modern Tech (Linear / Vercel style)"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Silicon Tech</span>
              </button>
              <button
                onClick={() => setCvStyle("modern")}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  cvStyle === "modern"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Стиль Executive Modern (Senior / Lead format)"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Executive</span>
              </button>
              <button
                onClick={() => setCvStyle("minimal")}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  cvStyle === "minimal"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Стиль ATS Minimal (Класичний чистий формат для систем скрінінгу)"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>ATS Minimal</span>
              </button>
            </div>

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
              title="Завантажити у форматі Word (.doc) з ім'ям розробника"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>{isEn ? "Word (.doc)" : "Зберегти Word"}</span>
            </button>

            {/* Save as PDF */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs active:scale-95"
              title="Зберегти як PDF файл з автоматичною назвою"
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

        {/* Quick Hint for PDF Auto-naming & Style */}
        <div className="px-5 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-[11px] text-blue-900 print:hidden">
          <span className="flex items-center gap-1.5 font-medium">
            💡 <strong>Автозбереження:</strong> Файл зберігається як <em>«{cleanName} - {cleanTitle}.pdf»</em> без зайвих системних дат і URL браузера.
          </span>
          <span className="hidden sm:inline text-blue-700/90 font-medium">
            Вибрано стиль: <strong>{cvStyle === "silicon" ? "⚡ Silicon Tech" : cvStyle === "modern" ? "👔 Executive Modern" : "📄 ATS Minimal"}</strong>
          </span>
        </div>

        {/* CV Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">
          <div 
            ref={printAreaRef}
            id="cv-printable-area"
            className="max-w-[794px] mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-md border border-slate-200/80 text-slate-900 font-sans"
            style={{
              fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
              WebkitFontSmoothing: "antialiased",
            }}
          >
            {/* Header / Contact */}
            <div className={`pb-4 mb-5 text-left flex justify-between items-baseline flex-wrap gap-2 ${
              cvStyle === "silicon"
                ? "border-b-2 border-slate-900"
                : cvStyle === "modern"
                ? "border-b-2 border-blue-900"
                : "border-b border-slate-900"
            }`}>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {cleanName}
                </h1>
                <p className={`text-sm font-bold mt-0.5 ${
                  cvStyle === "silicon"
                    ? "text-blue-600"
                    : cvStyle === "modern"
                    ? "text-blue-900 uppercase tracking-wider"
                    : "text-slate-700 font-semibold"
                }`}>
                  {cleanTitle}
                </p>
              </div>
              <div className="text-xs text-slate-600 text-right">
                <p className="font-semibold text-slate-900">
                  {candidate.yearsOfExperience}+ {isEn ? "years commercial experience" : "років комерційного досвіду"}
                </p>
                <p className="text-slate-500">Ukraine · Open for Opportunities</p>
              </div>
            </div>

            {/* Professional Summary */}
            <div className="mb-5 cv-section">
              <h2 className={`text-xs font-bold uppercase tracking-wider pb-1 mb-2 ${
                cvStyle === "silicon"
                  ? "text-slate-900 border-b-2 border-blue-600"
                  : cvStyle === "modern"
                  ? "text-blue-900 border-b-2 border-blue-900"
                  : "text-slate-900 border-b border-slate-900"
              }`}>
                {isEn ? "Professional Summary" : "Професійний підсумок"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {tailoredCV.tailoredSummary}
              </p>
            </div>

            {/* Core Competencies & Skills */}
            <div className="mb-5 cv-section">
              <h2 className={`text-xs font-bold uppercase tracking-wider pb-1 mb-2.5 ${
                cvStyle === "silicon"
                  ? "text-slate-900 border-b-2 border-blue-600"
                  : cvStyle === "modern"
                  ? "text-blue-900 border-b-2 border-blue-900"
                  : "text-slate-900 border-b border-slate-900"
              }`}>
                {isEn ? "Technical Skills & Competencies" : "Технічні навички та компетенції"}
              </h2>
              
              {cvStyle === "minimal" ? (
                <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                  {tailoredCV.highlightedSkills.join(" · ")}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {tailoredCV.highlightedSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                        cvStyle === "silicon"
                          ? "bg-slate-50 text-slate-900 border-slate-300 font-mono"
                          : "bg-white text-slate-800 border-slate-300"
                      }`}
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Experience Section */}
            <div className="mb-4 cv-section">
              <h2 className={`text-xs font-bold uppercase tracking-wider pb-1 mb-3 ${
                cvStyle === "silicon"
                  ? "text-slate-900 border-b-2 border-blue-600"
                  : cvStyle === "modern"
                  ? "text-blue-900 border-b-2 border-blue-900"
                  : "text-slate-900 border-b border-slate-900"
              }`}>
                {isEn ? "Professional Experience" : "Досвід роботи"}
              </h2>
              <div className="space-y-4">
                {tailoredCV.optimizedExperiences.map((exp, idx) => {
                  const period = exp.period || candidate.experiences.find((e) => e.company.toLowerCase() === exp.company.toLowerCase())?.period || candidate.experiences[idx]?.period || "";
                  return (
                    <div key={idx} className="space-y-1.5 cv-section">
                      <div className="flex justify-between items-baseline flex-wrap gap-1">
                        <h3 className="text-sm font-bold text-slate-900">
                          {exp.position} <span className={cvStyle === "silicon" ? "text-blue-600 font-semibold" : cvStyle === "modern" ? "text-slate-600 italic font-normal" : "text-slate-600 font-normal"}>| {exp.company}</span>
                        </h3>
                        {period && (
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                            cvStyle === "silicon"
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : cvStyle === "modern"
                              ? "text-slate-600"
                              : "text-slate-600 font-normal"
                          }`}>
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
