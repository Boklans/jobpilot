"use client";

import React, { useRef } from "react";
import { CandidateProfile, JobListing, TailoredCVResult } from "@/types";
import { Download, Printer, X, CheckCircle2, Sparkles, Building, Briefcase } from "lucide-react";

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

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Modal Top Toolbar (Not included in print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                Адаптоване резюме під {job.company}
                <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  ATS Verified
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Позиція: {job.title} · Кандидат: {candidate.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Друк / Зберегти як PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CV Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 print:p-0 print:bg-white">
          <div 
            ref={printAreaRef}
            id="cv-printable-area"
            className="max-w-[794px] mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-md border border-slate-200/80 print:shadow-none print:border-none print:p-0 print:max-w-none text-slate-900 font-sans"
          >
            {/* Header / Contact */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6 text-center sm:text-left flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {candidate.fullName}
                </h1>
                <p className="text-sm font-semibold text-blue-700 mt-1">
                  {candidate.title}
                </p>
              </div>
              <div className="text-xs text-slate-500 space-y-0.5 sm:text-right">
                <p>Досвід: {candidate.yearsOfExperience}+ років</p>
                <p className="text-slate-400 print:hidden font-medium">Оптимізовано для: {job.company}</p>
              </div>
            </div>

            {/* Professional Summary */}
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2">
                Professional Summary
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {tailoredCV.tailoredSummary}
              </p>
            </div>

            {/* Core Competencies & Skills */}
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2.5">
                Technical Skills & Competencies
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {tailoredCV.highlightedSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-medium px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience Section */}
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-3">
                Professional Experience
              </h2>
              <div className="space-y-5">
                {tailoredCV.optimizedExperiences.map((exp, idx) => (
                  <div key={idx} className="space-y-1.5">
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

            {/* ATS Note Badge at footer (hidden in print) */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 print:hidden">
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ключові слова ATS інтегровано без вигадування досвіду
              </span>
              <span>Generated with JobPilot</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

