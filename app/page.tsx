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
        activeCandidate={activeCandidate}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Hero Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Daily Application Focus
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Good morning, {activeCandidate.fullName.split(" ")[0]}
                </h1>
                <p className="text-sm text-slate-500">
                  <strong className="text-slate-800 font-semibold">What should I apply to next?</strong> · {currentAnalyses.filter(a => a.analysis.score >= 85).length} strong opportunities waiting for you.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab("analyze")}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition shadow-md shadow-blue-600/20 active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze a Job</span>
                </button>
              </div>
            </div>

            {/* Recommended Opportunities List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Recommended Opportunities</h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Вакансії, де профіль має найвищі шанси пройти скринінг рекрутера.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("analyze")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Переглянути всі ({currentAnalyses.length}) →
                </button>
              </div>

              <div className="space-y-3">
                {currentAnalyses.slice(0, 3).map(({ job, analysis }) => (
                  <div
                    key={job.id}
                    onClick={() => setActiveTab("analyze")}
                    className="group bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition">
                          {job.title}
                        </h3>
                        {job.salary && (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {job.salary}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{job.company}</span>
                        <span>·</span>
                        <span>{job.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <span className={`text-base font-black px-3 py-1 rounded-xl border ${
                          analysis.score >= 85
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {analysis.score}% MATCH
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition hidden sm:inline">
                        View Match →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
