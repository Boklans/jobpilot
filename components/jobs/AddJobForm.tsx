"use client";

import React, { useState } from "react";
import { Sparkles, Link as LinkIcon, FileText } from "lucide-react";
import { JobListing } from "@/types";

interface AddJobFormProps {
  onAnalyze: (job: JobListing) => void;
  isLoading: boolean;
}

export function AddJobForm({ onAnalyze, isLoading }: AddJobFormProps) {
  const [activeMode, setActiveMode] = useState<"text" | "url">("text");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("Remote");
  const [salary, setSalary] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim() && !jobUrl.trim()) return;

    const newJob: JobListing = {
      id: "job-" + Date.now(),
      title: jobTitle || "Software Engineer",
      company: company || "Tech Company",
      location: location || "Remote",
      salary: salary || undefined,
      sourceUrl: jobUrl || undefined,
      rawDescription: jobDescription || `Imported Job from: ${jobUrl}\nAnalyzing requirements automatically...`,
      createdAt: new Date().toISOString(),
    };

    onAnalyze(newJob);
  };

  const handleFillSample = () => {
    setJobTitle("Senior React / React Native Engineer");
    setCompany("Apex Mobility");
    setLocation("Remote · Europe");
    setSalary("$4,500 - $6,000");
    setJobUrl("https://djinni.co/jobs/senior-mobile-engineer");
    setJobDescription(`We are looking for a Senior React / React Native developer to join our team.

Responsibilities:
- Build high-performance mobile and web interfaces with React Native, React and TypeScript.
- Optimize app loading performance and memory usage.
- Work closely with backend engineers using GraphQL & REST.

Requirements:
- 5+ years of commercial development experience
- Solid TypeScript & React Native skills
- Experience with Expo, Redux / Zustand, and Docker
- AWS or Cloud infrastructure knowledge is a big advantage
- Strong communication skills, B2+ English`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Проаналізувати нову вакансію
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Вставте опис або посилання з Djinni, DOU, LinkedIn чи Work.ua для моментального Match Score.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFillSample}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition border border-blue-200 self-start sm:self-auto"
        >
          Заповнити приклад (Djinni)
        </button>
      </div>

      <div className="flex border-b border-slate-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveMode("text")}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition -mb-[2px] ${
            activeMode === "text"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          Вставити текст вакансії (Рекомендовано)
        </button>

        <button
          type="button"
          onClick={() => setActiveMode("url")}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition -mb-[2px] ${
            activeMode === "url"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          Посилання на вакансію (URL)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Посада
            </label>
            <input
              type="text"
              placeholder="e.g. Senior React Developer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Компанія
            </label>
            <input
              type="text"
              placeholder="e.g. Fintech Corp"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Локація / Формат
            </label>
            <input
              type="text"
              placeholder="e.g. Remote / Kyiv"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Зарплатна вилка (опціонально)
            </label>
            <input
              type="text"
              placeholder="e.g. $4,000 - $5,500"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>
        </div>

        {activeMode === "url" && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              URL вакансії
            </label>
            <input
              type="url"
              placeholder="https://djinni.co/jobs/..."
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Опис та вимоги вакансії
          </label>
          <textarea
            rows={5}
            placeholder="Скопіюйте сюди текст вимог або весь опис вакансії..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-sans"
            required={activeMode === "text"}
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition shadow-md shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? "Аналізую вакансію..." : "Розрахувати Match Score"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

