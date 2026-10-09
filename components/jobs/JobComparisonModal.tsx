"use client";

import React from "react";
import { CandidateProfile, JobListing, MatchAnalysisResult } from "@/types";
import { 
  X, 
  Sparkles, 
  Award, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  DollarSign, 
  Building, 
  Layers,
  TrendingUp,
  MapPin
} from "lucide-react";
import { calculateSalaryInsights } from "@/lib/ai/matcher";
import { translations, Language } from "@/lib/translations";
import { scrollIntoCenter } from "@/lib/utils";

interface JobComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  analyses: { job: JobListing; analysis: MatchAnalysisResult }[];
  candidate: CandidateProfile;
  lang?: Language;
  onSelectJob?: (jobId: string) => void;
}

export function JobComparisonModal({
  isOpen,
  onClose,
  analyses,
  candidate,
  lang = "ua",
  onSelectJob,
}: JobComparisonModalProps) {
  if (!isOpen || analyses.length === 0) return null;

  const t = translations[lang].comparison;
  const isEn = lang === "en";

  // Find the top-scoring job
  const topScore = Math.max(...analyses.map((a) => a.analysis.score));

  const handleJumpToJob = (jobId: string) => {
    onClose();
    if (onSelectJob) {
      onSelectJob(jobId);
    }
    setTimeout(() => {
      const el = document.getElementById(`job-analysis-${jobId}`);
      if (el) {
        scrollIntoCenter(el);
      }
    }, 150);
  };

  const getScreeningOddsText = (score: number) => {
    if (score >= 85) return isEn ? "High (80%+)" : "Високі (80%+)";
    if (score >= 70) return isEn ? "Moderate (~60%)" : "Помірні (~60%)";
    if (score >= 50) return isEn ? "Low (~30%)" : "Низькі (~30%)";
    return isEn ? "Minimal (<15%)" : "Мінімальні (<15%)";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {t.modalTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {t.modalSub}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
            title={t.closeBtn}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matrix Table Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6">
          <div className="min-w-[700px] border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200">
                  <th className="p-4 w-44 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                    {t.colCriteria}
                  </th>
                  {analyses.map(({ job, analysis }) => {
                    const isTop = analysis.score === topScore && topScore >= 60;
                    return (
                      <th 
                        key={job.id} 
                        className={`p-4 align-top border-l border-slate-200 font-normal ${
                          isTop ? "bg-blue-50/50" : ""
                        }`}
                      >
                        {isTop && (
                          <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold tracking-wide uppercase shadow-2xs">
                            <Award className="w-3 h-3" />
                            <span>{t.topChoiceBadge}</span>
                          </div>
                        )}
                        <div className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                          {job.title}
                        </div>
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.company}</span>
                          <span className="text-slate-300">•</span>
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.location}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* 1. MATCH SCORE ROW */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/40">
                    {t.matchScoreRow}
                  </td>
                  {analyses.map(({ job, analysis }) => (
                    <td key={job.id} className="p-4 border-l border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl sm:text-3xl font-black tabular-nums ${
                          analysis.score >= 85 ? "text-emerald-600" : analysis.score >= 70 ? "text-blue-600" : analysis.score >= 50 ? "text-amber-600" : "text-rose-600"
                        }`}>
                          {analysis.score}%
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          analysis.score >= 85 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          analysis.score >= 70 ? "bg-blue-50 text-blue-700 border-blue-200" :
                          analysis.score >= 50 ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {analysis.score >= 85 ? "Strong" : analysis.score >= 70 ? "Good" : analysis.score >= 50 ? "Partial" : "Low"}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 2. SCREENING ODDS ROW */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/40">
                    {t.screeningRow}
                  </td>
                  {analyses.map(({ job, analysis }) => (
                    <td key={job.id} className="p-4 border-l border-slate-200 font-semibold text-slate-800">
                      {getScreeningOddsText(analysis.score)}
                    </td>
                  ))}
                </tr>

                {/* 3. SALARY BENCHMARK ROW */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/40">
                    {t.salaryRow}
                  </td>
                  {analyses.map(({ job }) => {
                    const salary = calculateSalaryInsights(candidate, job, isEn);
                    return (
                      <td key={job.id} className="p-4 border-l border-slate-200">
                        {job.salary ? (
                          <div className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block border border-emerald-100">
                            {job.salary}
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900">
                              ${salary.estimatedMin.toLocaleString()} – ${salary.estimatedMax.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              ({isEn ? "Est. Median" : "Оцінка медіани"}: ${salary.median.toLocaleString()})
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 4. KEY STRENGTHS ROW */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/40 align-top">
                    {t.strengthsRow}
                  </td>
                  {analyses.map(({ job, analysis }) => (
                    <td key={job.id} className="p-4 border-l border-slate-200 align-top space-y-1.5">
                      {analysis.strengths.slice(0, 3).map((st, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{st}</span>
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>

                {/* 5. GAPS & RISKS ROW */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/40 align-top">
                    {t.gapsRow}
                  </td>
                  {analyses.map(({ job, analysis }) => (
                    <td key={job.id} className="p-4 border-l border-slate-200 align-top space-y-1.5">
                      {analysis.missingSkills.length > 0 ? (
                        analysis.missingSkills.slice(0, 3).map((sk, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-rose-700">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>{sk}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-700 font-medium">
                          ✓ {isEn ? "No critical skill gaps" : "Критичних прогалин немає"}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 6. ACTION ROW */}
                <tr className="bg-slate-50/60">
                  <td className="p-4 font-bold text-slate-700">
                    {t.actionRow}
                  </td>
                  {analyses.map(({ job }) => (
                    <td key={job.id} className="p-4 border-l border-slate-200">
                      <button
                        onClick={() => handleJumpToJob(job.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition shadow-xs"
                      >
                        <span>{t.openCardBtn}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

