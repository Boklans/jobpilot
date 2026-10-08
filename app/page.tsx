"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { AddJobForm } from "@/components/jobs/AddJobForm";
import { MatchAnalysisCard } from "@/components/jobs/MatchAnalysisCard";
import { TrackerBoard } from "@/components/applications/TrackerBoard";
import { CandidateProfileView } from "@/components/cv/CandidateProfileView";
import { 
  sampleCandidateProfiles,
  sampleJobs, 
  initialApplications 
} from "@/lib/mockData";
import { 
  CandidateProfile, 
  JobListing, 
  MatchAnalysisResult, 
  ApplicationTrackerItem, 
  ApplicationStatus 
} from "@/types";
import { analyzeJobMatch } from "@/lib/ai/matcher";
import { 
  Sparkles, 
  Briefcase, 
  CheckCircle, 
  ArrowRight, 
  PlusCircle, 
  TrendingUp, 
  ShieldCheck,
  Zap,
  Users
} from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [lang, setLang] = useState<"ua" | "en">("ua");
  const [candidates, setCandidates] = useState<CandidateProfile[]>(sampleCandidateProfiles);
  const [activeCandidateId, setActiveCandidateId] = useState<string>(sampleCandidateProfiles[0].id);
  const [applications, setApplications] = useState<ApplicationTrackerItem[]>(initialApplications);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalyses, setCurrentAnalyses] = useState<{ job: JobListing; analysis: MatchAnalysisResult }[]>([]);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  // 1. Load persisted data from localStorage on client mount
  useEffect(() => {
    try {
      const savedCand = localStorage.getItem("jobpilot_candidates");
      if (savedCand) {
        const parsed = JSON.parse(savedCand);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCandidates(parsed);
        }
      }

      const savedActiveId = localStorage.getItem("jobpilot_active_id");
      if (savedActiveId) {
        setActiveCandidateId(savedActiveId);
      }

      const savedLang = localStorage.getItem("jobpilot_lang") as "ua" | "en" | null;
      if (savedLang === "ua" || savedLang === "en") {
        setLang(savedLang);
      }

      const savedAnalyses = localStorage.getItem("jobpilot_analyses");
      if (savedAnalyses) {
        const parsed = JSON.parse(savedAnalyses);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCurrentAnalyses(parsed);
        }
      }

      const savedApps = localStorage.getItem("jobpilot_applications");
      if (savedApps) {
        const parsed = JSON.parse(savedApps);
        if (Array.isArray(parsed)) {
          setApplications(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load from localStorage:", e);
    } finally {
      setHasLoadedStorage(true);
    }
  }, []);

  // 2. Persist state changes into localStorage
  useEffect(() => {
    if (!hasLoadedStorage) return;
    try {
      localStorage.setItem("jobpilot_candidates", JSON.stringify(candidates));
    } catch (e) {}
  }, [candidates, hasLoadedStorage]);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    try {
      localStorage.setItem("jobpilot_active_id", activeCandidateId);
    } catch (e) {}
  }, [activeCandidateId, hasLoadedStorage]);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    try {
      localStorage.setItem("jobpilot_lang", lang);
    } catch (e) {}
  }, [lang, hasLoadedStorage]);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    try {
      localStorage.setItem("jobpilot_analyses", JSON.stringify(currentAnalyses));
    } catch (e) {}
  }, [currentAnalyses, hasLoadedStorage]);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    try {
      localStorage.setItem("jobpilot_applications", JSON.stringify(applications));
    } catch (e) {}
  }, [applications, hasLoadedStorage]);

  const activeCandidate = candidates.find((c) => c.id === activeCandidateId) || candidates[0];

  // 3. Fallback demo analyses ONLY if first time ever and nothing in storage
  useEffect(() => {
    if (!hasLoadedStorage) return;
    if (currentAnalyses.length === 0 && activeCandidate) {
      let isMounted = true;
      Promise.all(
        sampleJobs.map(async (job) => {
          const analysis = await analyzeJobMatch(activeCandidate, job);
          return { job, analysis };
        })
      ).then((results) => {
        if (isMounted) setCurrentAnalyses(results);
      });
      return () => { isMounted = false; };
    }
  }, [hasLoadedStorage]);

  const handleSelectCandidate = (id: string) => {
    setActiveCandidateId(id);
  };

  const handleAddNewCandidate = () => {
    const newCand: CandidateProfile = {
      id: "cand-" + Date.now(),
      fullName: "Новий Кандидат",
      title: "Software Engineer",
      summary: "Завантажте резюме кандидата для автоматичного заповнення або відредагуйте профіль.",
      yearsOfExperience: 3,
      skills: ["JavaScript", "Git"],
      experiences: []
    };
    setCandidates((prev) => [newCand, ...prev]);
    setActiveCandidateId(newCand.id);
    setActiveTab("profile");
  };

  const handleUpdateActiveProfile = (updated: CandidateProfile) => {
    const profileToSave: CandidateProfile = { ...updated, id: activeCandidateId };
    setCandidates((prev) =>
      prev.map((c) => (c.id === activeCandidateId ? profileToSave : c))
    );
  };

  const handleAnalyzeNewJob = async (job: JobListing) => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeJobMatch(activeCandidate, job);
      setCurrentAnalyses((prev) => [{ job, analysis }, ...prev]);
      setActiveTab("analyze");
      setTimeout(() => {
        const el = document.getElementById(`job-analysis-${job.id}`) || document.getElementById("analyzed-results-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteAnalysis = (jobId: string) => {
    setCurrentAnalyses((prev) => prev.filter((item) => item.job.id !== jobId));
  };

  const handleAddToTracker = (job: JobListing, score: number) => {
    const exists = applications.some((app) => app.job.id === job.id);
    if (!exists) {
      const newApp: ApplicationTrackerItem = {
        id: "app-" + Date.now(),
        job,
        status: "applied",
        matchScore: score,
        notes: `Відгук підготовлено через JobPilot (${score}% Match).`,
        updatedAt: new Date().toISOString(),
      };
      setApplications([newApp, ...applications]);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  const handleDeleteApplication = (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeCandidate={activeCandidate}
        lang={lang}
        setLang={setLang}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Dynamic Copilot Pulse Hero Banner */}
            <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Job Search Pulse
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Доброго дня, {activeCandidate.fullName.split(" ")[0]} 👋
                </h1>

                {/* Live Bullet Insights */}
                <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong className="text-slate-900 font-semibold">{currentAnalyses.filter(a => a.analysis.score >= 85).length} Strong Matches</strong> готові до адаптації</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-purple-600 font-bold">⚡</span>
                    <span><strong className="text-slate-900 font-semibold">{applications.filter(a => a.status === 'interview').length} компанія</strong> призначила інтерв'ю (Nordic FinTech)</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-blue-600 font-bold">📊</span>
                    <span>Твій середній Match Score: <strong className="text-slate-900 font-semibold">
                      {Math.round(currentAnalyses.reduce((acc, curr) => acc + curr.analysis.score, 0) / Math.max(currentAnalyses.length, 1))}%
                    </strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setActiveTab("analyze")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-blue-600 transition shadow-md active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>+ Quick Job Match</span>
                </button>
              </div>
            </div>

            {/* Recommended Opportunities List - The Visual Core */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>Recommended Opportunities</span>
                    <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                      {currentAnalyses.length}
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Вакансії, де твій профіль має найвищу конверсію на інтерв'ю.
                  </p>
                </div>
                {currentAnalyses.length > 0 && (
                  <button
                    onClick={() => setActiveTab("analyze")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Переглянути всі ({currentAnalyses.length}) →
                  </button>
                )}
              </div>

              {currentAnalyses.length > 0 ? (
                <div className="space-y-3.5">
                  {currentAnalyses.slice(0, 4).map(({ job, analysis }) => (
                    <div
                      key={job.id}
                      onClick={() => {
                        setActiveTab("analyze");
                        setTimeout(() => {
                          const el = document.getElementById(`job-analysis-${job.id}`);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 100);
                      }}
                      className="group bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-blue-600 transition">
                              {job.title}
                            </h3>
                            {job.salary && (
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                {job.salary}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span className="text-slate-800 font-semibold">{job.company}</span>
                            <span>·</span>
                            <span>{job.location}</span>
                          </div>

                          {/* 2-3 Match Reasons */}
                          <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                            {analysis.strengths.slice(0, 3).map((strength, sIdx) => (
                              <span key={sIdx} className="inline-flex items-center gap-1.5 text-slate-700">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span>{strength}</span>
                              </span>
                            ))}
                            {analysis.missingSkills.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                                <span>⚠ Бракує:</span> {analysis.missingSkills.slice(0, 2).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right Apple-style Score + Action */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                          <div className="text-right">
                            <span className={`text-2xl sm:text-3xl font-black tracking-tight tabular-nums ${
                              analysis.score >= 85 ? "text-emerald-600" : analysis.score >= 70 ? "text-blue-600" : "text-amber-600"
                            }`}>
                              {analysis.score}%
                            </span>
                            <span className="text-[10px] block font-bold uppercase tracking-wider text-slate-400">
                              {analysis.recommendation.replace('_', ' ')}
                            </span>
                          </div>

                          <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition hidden sm:inline-flex items-center gap-1">
                            Breakdown →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-slate-200/90 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Поки що немає проаналізованих вакансій</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Вставте першу вакансію з Djinni, DOU або LinkedIn, щоб згенерувати розбір відповідності та персональні рекомендації.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab("analyze")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Проаналізувати вакансію</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Applications Preview */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Recent Applications</h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Статус ваших останніх поданих заявок у трекері.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("tracker")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Відкрити трекер ({applications.length}) →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {applications.slice(0, 2).map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setActiveTab("tracker")}
                    className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{app.job.company}</h4>
                      <p className="text-xs text-slate-500">{app.job.title}</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider bg-slate-100 text-slate-700">
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANALYZE TAB */}
        {activeTab === "analyze" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <AddJobForm onAnalyze={handleAnalyzeNewJob} isLoading={isAnalyzing} />

            <div id="analyzed-results-section" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === "en" ? "Analyzed Vacancies" : "Аналіз вакансій"} ({currentAnalyses.length})
                </h3>
              </div>
              {currentAnalyses.map(({ job, analysis }) => (
                <MatchAnalysisCard
                  key={job.id}
                  job={job}
                  analysis={analysis}
                  candidate={activeCandidate}
                  onAddToTracker={handleAddToTracker}
                  onDeleteJob={handleDeleteAnalysis}
                />
              ))}
            </div>
          </div>
        )}

        {/* TRACKER TAB */}
        {activeTab === "tracker" && (
          <div className="animate-in fade-in duration-300">
            <TrackerBoard
              applications={applications}
              onUpdateStatus={handleUpdateStatus}
              onDeleteApplication={handleDeleteApplication}
            />
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="animate-in fade-in duration-300">
            <CandidateProfileView
              profile={activeCandidate}
              onUpdateProfile={handleUpdateActiveProfile}
            />
          </div>
        )}
      </main>
    </div>
  );
}
