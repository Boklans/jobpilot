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
  ApplicationStatus,
  TailoredCVResult,
  CoverLetterResult
} from "@/types";
import { analyzeJobMatch } from "@/lib/ai/matcher";
import { smoothScrollTo, scrollIntoCenter } from "@/lib/utils";
import { translations, Language } from "@/lib/translations";
import { 
  Sparkles, 
  Briefcase, 
  CheckCircle, 
  ArrowRight, 
  PlusCircle, 
  TrendingUp, 
  ShieldCheck,
  Zap,
  Users,
  Calendar,
  Layers
} from "lucide-react";
import { JobComparisonModal } from "@/components/jobs/JobComparisonModal";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [lang, setLang] = useState<Language>("ua");
  const [candidates, setCandidates] = useState<CandidateProfile[]>(sampleCandidateProfiles);
  const [activeCandidateId, setActiveCandidateId] = useState<string>(sampleCandidateProfiles[0].id);
  const [applications, setApplications] = useState<ApplicationTrackerItem[]>(initialApplications);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalyses, setCurrentAnalyses] = useState<{ job: JobListing; analysis: MatchAnalysisResult }[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
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
    const isEn = lang === "en";
    const newCand: CandidateProfile = {
      id: "cand-" + Date.now(),
      fullName: isEn ? "New Candidate" : "Новий Кандидат",
      title: "Software Engineer",
      summary: isEn 
        ? "Upload your CV (PDF/DOCX) or edit your skills and work history."
        : "Завантажте резюме кандидата (PDF/DOCX) або заповніть навички та історію роботи.",
      yearsOfExperience: 3,
      skills: ["JavaScript", "TypeScript", "Git"],
      experiences: []
    };
    setCandidates((prev) => [...prev, newCand]);
    setActiveCandidateId(newCand.id);
    setActiveTab("profile");
  };

  const handleDeleteCandidate = (id: string) => {
    if (candidates.length <= 1) return;
    const remaining = candidates.filter((c) => c.id !== id);
    setCandidates(remaining);
    if (activeCandidateId === id) {
      setActiveCandidateId(remaining[0].id);
    }
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
          scrollIntoCenter(el);
        }
      }, 150);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteAnalysis = (jobId: string) => {
    setCurrentAnalyses((prev) => prev.filter((item) => item.job.id !== jobId));
  };

  const handleAddToTracker = (
    job: JobListing,
    score: number,
    tailoredCV?: TailoredCVResult | null,
    coverLetter?: CoverLetterResult | null
  ) => {
    const existingIndex = applications.findIndex((app) => app.job.id === job.id);
    if (existingIndex >= 0) {
      setApplications((prev) =>
        prev.map((app, idx) =>
          idx === existingIndex
            ? {
                ...app,
                matchScore: score,
                tailoredCV: tailoredCV || app.tailoredCV,
                coverLetter: coverLetter || app.coverLetter,
                updatedAt: new Date().toISOString(),
              }
            : app
        )
      );
    } else {
      const newApp: ApplicationTrackerItem = {
        id: "app-" + Date.now(),
        job,
        status: "applied",
        matchScore: score,
        notes: `Відгук підготовлено через JobPilot (${score}% Match).`,
        tailoredCV: tailoredCV || undefined,
        coverLetter: coverLetter || undefined,
        updatedAt: new Date().toISOString(),
      };
      setApplications([newApp, ...applications]);
    }
  };

  const handleUpdateApplication = (updatedApp: ApplicationTrackerItem) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app))
    );
  };

  const handleUpdateStatus = (id: string, newStatus: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  const handleDeleteApplication = (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };

  const handleExportBackup = () => {
    const backupData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      lang,
      candidates,
      activeCandidateId,
      currentAnalyses,
      applications,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `jobpilot-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const data = JSON.parse(text);
          if (!data || typeof data !== "object") {
            throw new Error("Invalid format");
          }

          if (Array.isArray(data.candidates) && data.candidates.length > 0) {
            setCandidates(data.candidates);
          }
          if (data.activeCandidateId) {
            setActiveCandidateId(data.activeCandidateId);
          }
          if (data.lang === "ua" || data.lang === "en") {
            setLang(data.lang);
          }
          if (Array.isArray(data.currentAnalyses)) {
            setCurrentAnalyses(data.currentAnalyses);
          }
          if (Array.isArray(data.applications)) {
            setApplications(data.applications);
          }

          resolve(true);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsText(file);
    });
  };

  const dt = translations[lang].dashboard;
  const isEn = lang === "en";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeCandidate={activeCandidate}
        candidates={candidates}
        onSelectCandidate={handleSelectCandidate}
        onCreateCandidate={handleAddNewCandidate}
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
                    {dt.pulseBadge}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {dt.greeting}, {activeCandidate.fullName.split(" ")[0]} 👋
                </h1>

                {/* Live Bullet Insights */}
                <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong className="text-slate-900 font-semibold">{currentAnalyses.filter(a => a.analysis.score >= 85).length} {dt.strongMatches}</strong> {dt.readyToTailor}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-purple-600 font-bold">⚡</span>
                    <span><strong className="text-slate-900 font-semibold">{applications.filter(a => a.status === 'interview').length} {isEn ? "companies" : "компанія"}</strong> {dt.interviewsScheduled}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-blue-600 font-bold">📊</span>
                    <span>{dt.avgMatchScore}: <strong className="text-slate-900 font-semibold">
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
                  <span>{dt.quickJobMatch}</span>
                </button>
              </div>
            </div>

            {/* Upcoming Interviews Reminder Banner if any scheduled */}
            {applications.some(a => a.status === 'interview' && a.interviewDate) && (
              <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-200/90 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {isEn ? "Upcoming Technical Interviews:" : "Заплановані співбесіди:"}
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {applications
                        .filter(a => a.status === 'interview' && a.interviewDate)
                        .map((app) => (
                          <span key={app.id} className="text-xs font-semibold text-purple-900 bg-white px-3 py-1 rounded-xl border border-purple-200 shadow-2xs">
                            <strong>{app.job.company}</strong> ({app.job.title}) — <span className="text-purple-600 font-bold">{app.interviewDate}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("tracker")}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 self-start sm:self-auto shrink-0 bg-white px-3 py-2 rounded-xl border border-purple-200 hover:bg-purple-50 transition"
                >
                  <span>{isEn ? "Open in Tracker →" : "Відкрити в Трекері →"}</span>
                </button>
              </div>
            )}

            {/* Recommended Opportunities List - The Visual Core */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>{dt.recommendedTitle}</span>
                    <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                      {currentAnalyses.length}
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {dt.recommendedSubtitle}
                  </p>
                </div>
                {currentAnalyses.length > 0 && (
                  <div className="flex items-center gap-2">
                    {currentAnalyses.length >= 2 && (
                      <button
                        onClick={() => setShowComparisonModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition shadow-2xs"
                      >
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>{translations[lang].comparison.compareBtn}</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab("analyze")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      {dt.viewAll} ({currentAnalyses.length}) →
                    </button>
                  </div>
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
                          if (el) scrollIntoCenter(el);
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
                                <span>⚠ {isEn ? "Missing:" : "Бракує:"}</span> {analysis.missingSkills.slice(0, 2).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right Score + Action */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                          <div className="text-right">
                            <span className={`text-2xl sm:text-3xl font-black tracking-tight tabular-nums ${
                              analysis.score >= 85 ? "text-emerald-600" : analysis.score >= 70 ? "text-blue-600" : analysis.score >= 50 ? "text-amber-600" : "text-rose-600"
                            }`}>
                              {analysis.score}%
                            </span>
                            <span className="text-[10px] block font-bold uppercase tracking-wider text-slate-400">
                              {analysis.recommendation.replace('_', ' ')}
                            </span>
                          </div>

                          <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition hidden sm:inline-flex items-center gap-1">
                            {isEn ? "Breakdown →" : "Деталі →"}
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
                  <h3 className="text-base font-bold text-slate-900">{isEn ? "No analyzed vacancies yet" : "Поки що немає проаналізованих вакансій"}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {dt.noAnalyses}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab("analyze")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isEn ? "Analyze a Job" : "Проаналізувати вакансію"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Applications Preview */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{isEn ? "Recent Applications" : "Останні заявки"}</h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {isEn ? "Status of your latest tracker applications." : "Статус ваших останніх поданих заявок у трекері."}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("tracker")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  {isEn ? "Open tracker" : "Відкрити трекер"} ({applications.length}) →
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
            <AddJobForm onAnalyze={handleAnalyzeNewJob} isLoading={isAnalyzing} lang={lang} />

            <div id="analyzed-results-section" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  {isEn ? "Analyzed Vacancies" : "Аналіз вакансій"} ({currentAnalyses.length})
                </h3>
                {currentAnalyses.length >= 2 && (
                  <button
                    onClick={() => setShowComparisonModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition shadow-2xs"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>{translations[lang].comparison.compareBtn}</span>
                  </button>
                )}
              </div>
              {currentAnalyses.map(({ job, analysis }) => (
                <MatchAnalysisCard
                  key={job.id}
                  job={job}
                  analysis={analysis}
                  candidate={activeCandidate}
                  onAddToTracker={handleAddToTracker}
                  onDeleteJob={handleDeleteAnalysis}
                  lang={lang}
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
              onUpdateApplication={handleUpdateApplication}
              onDeleteApplication={handleDeleteApplication}
              candidate={activeCandidate}
              lang={lang}
            />
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="animate-in fade-in duration-300">
            <CandidateProfileView
              profile={activeCandidate}
              candidates={candidates}
              onUpdateProfile={handleUpdateActiveProfile}
              onSelectCandidate={handleSelectCandidate}
              onCreateCandidate={handleAddNewCandidate}
              onDeleteCandidate={handleDeleteCandidate}
              lang={lang}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
            />
          </div>
        )}

        {/* Level 3: Job Comparison Matrix Modal */}
        <JobComparisonModal
          isOpen={showComparisonModal}
          onClose={() => setShowComparisonModal(false)}
          analyses={currentAnalyses}
          candidate={activeCandidate}
          lang={lang}
          onSelectJob={() => setActiveTab("analyze")}
        />
      </main>
    </div>
  );
}
