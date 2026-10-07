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
  const [candidates, setCandidates] = useState<CandidateProfile[]>(sampleCandidateProfiles);
  const [activeCandidateId, setActiveCandidateId] = useState<string>(sampleCandidateProfiles[0].id);
  const [applications, setApplications] = useState<ApplicationTrackerItem[]>(initialApplications);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalyses, setCurrentAnalyses] = useState<{ job: JobListing; analysis: MatchAnalysisResult }[]>([]);

  const activeCandidate = candidates.find((c) => c.id === activeCandidateId) || candidates[0];

  // Recalculate match analyses when candidate changes
  useEffect(() => {
    let isMounted = true;
    async function recalculate() {
      if (!activeCandidate) return;
      const results = await Promise.all(
        sampleJobs.map(async (job) => {
          const analysis = await analyzeJobMatch(activeCandidate, job);
          return { job, analysis };
        })
      );
      if (isMounted) {
        setCurrentAnalyses(results);
      }
    }
    recalculate();
    return () => { isMounted = false; };
  }, [activeCandidateId, candidates]);

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
    setCandidates((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const handleAnalyzeNewJob = async (job: JobListing) => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeJobMatch(activeCandidate, job);
      setCurrentAnalyses((prev) => [{ job, analysis }, ...prev]);
      setActiveTab("analyze");
    } finally {
      setIsAnalyzing(false);
    }
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
        candidates={candidates}
        activeCandidate={activeCandidate}
        onSelectCandidate={handleSelectCandidate}
        onAddNewCandidate={handleAddNewCandidate}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-7 sm:p-9 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
              
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-blue-200 font-medium">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>JobPilot Active Copilot</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Доброго дня, {activeCandidate.fullName.split(" ")[0]}!
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Не витрачайте час на сотні шаблонних відгуків. Перевіряйте Match Score, підсилюйте резюме під вимоги та відгукуйтесь із впевненістю.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab("analyze")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition shadow-lg shadow-blue-600/30 active:scale-[0.98]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Проаналізувати вакансію</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("tracker")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition border border-white/20 active:scale-[0.98]"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Відкрити трекер ({applications.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Активних вакансій
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-slate-900">{currentAnalyses.length}</span>
                  <span className="text-xs text-emerald-600 font-semibold">+2 сьогодні</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Strong Match (85%+)
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-emerald-600">
                    {currentAnalyses.filter((a) => a.analysis.score >= 85).length}
                  </span>
                  <span className="text-xs text-slate-500">Високі шанси</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Подано заявок
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-blue-600">{applications.length}</span>
                  <span className="text-xs text-blue-600 font-semibold">У трекері</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Призначено інтерв'ю
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-purple-600">
                    {applications.filter((a) => a.status === "interview").length}
                  </span>
                  <span className="text-xs text-purple-600 font-semibold">Активні розмови</span>
                </div>
              </div>
            </div>

            {/* Quick Add Form on Dashboard */}
            <AddJobForm onAnalyze={handleAnalyzeNewJob} isLoading={isAnalyzing} />

            {/* Matched Jobs Feed */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Рекомендовані вакансії та Match Analysis</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Результати перевірки вимог під активне резюме розробника.
                  </p>
                </div>
              </div>

              {currentAnalyses.map(({ job, analysis }) => (
                <MatchAnalysisCard
                  key={job.id}
                  job={job}
                  analysis={analysis}
                  candidate={activeCandidate}
                  onAddToTracker={handleAddToTracker}
                />
              ))}
            </div>
          </div>
        )}

        {/* ANALYZE TAB */}
        {activeTab === "analyze" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <AddJobForm onAnalyze={handleAnalyzeNewJob} isLoading={isAnalyzing} />

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Аналіз вакансій</h3>
              {currentAnalyses.map(({ job, analysis }) => (
                <MatchAnalysisCard
                  key={job.id}
                  job={job}
                  analysis={analysis}
                  candidate={activeCandidate}
                  onAddToTracker={handleAddToTracker}
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
