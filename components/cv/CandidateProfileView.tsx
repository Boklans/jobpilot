"use client";

import React, { useState, useEffect } from "react";
import { CandidateProfile, ExperienceItem } from "@/types";
import { User, Briefcase, Plus, X, UploadCloud, CheckCircle2, Edit3, Save } from "lucide-react";

interface CandidateProfileViewProps {
  profile: CandidateProfile;
  onUpdateProfile: (updated: CandidateProfile) => void;
}

export function CandidateProfileView({ profile, onUpdateProfile }: CandidateProfileViewProps) {
  const [newSkill, setNewSkill] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [title, setTitle] = useState(profile?.title || "");
  const [years, setYears] = useState(profile?.yearsOfExperience || 3);
  const [summary, setSummary] = useState(profile?.summary || "");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Sync state whenever active profile changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setTitle(profile.title || "");
      setYears(profile.yearsOfExperience || 3);
      setSummary(profile.summary || "");
    }
  }, [profile]);

  const skillsList = profile?.skills || [];
  const experiencesList = profile?.experiences || [];

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (!skillsList.includes(newSkill.trim())) {
      onUpdateProfile({
        ...profile,
        skills: [...skillsList, newSkill.trim()]
      });
    }
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onUpdateProfile({
      ...profile,
      skills: skillsList.filter(s => s !== skillToRemove)
    });
  };

  const handleSaveProfile = () => {
    onUpdateProfile({
      ...profile,
      fullName: fullName.trim() || "Candidate",
      title: title.trim() || "Software Engineer",
      yearsOfExperience: Number(years) || 0,
      summary: summary.trim()
    });
    setIsEditing(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-cv", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Помилка аналізу файлу");
      }

      onUpdateProfile(data.profile);
      setUploadSuccess(`Резюме "${file.name}" успішно розпізнано та оновлено!`);
      setTimeout(() => setUploadSuccess(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Candidate Profile</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Фундамент професійного профілю, за яким JobPilot розраховує Match Score та адаптує резюме.
          </p>
        </div>

        {/* Upload new CV button */}
        <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-blue-600 transition shadow-xs self-start sm:self-auto ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <UploadCloud className="w-4 h-4" />
          <span>{isUploading ? "Обробка резюме..." : "Upload new CV"}</span>
          <input 
            type="file" 
            accept=".pdf,.docx,.txt" 
            className="hidden" 
            onChange={handleFileUpload} 
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Profile Completeness Widget */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Profile Completeness
            </span>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              92% Complete
            </span>
          </div>
          <div className="w-full max-w-md h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-[92%] transition-all" />
          </div>
        </div>
        <p className="text-xs text-slate-500 sm:max-w-xs sm:text-right">
          Профіль чудово деталізовано: виявлено {skillsList.length} підтверджених навичок та {profile?.yearsOfExperience || 0}+ років комерційного досвіду.
        </p>
      </div>

      {/* Upload Status Alerts */}
      {isUploading && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-xs flex items-center gap-2 animate-pulse">
          <span className="text-base animate-spin">⚡</span>
          <span className="font-medium">JobPilot витягує текст, технології, досвід та структуру з файлу...</span>
        </div>
      )}

      {uploadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-center gap-2">
          <span className="text-rose-600 font-bold shrink-0">✕</span>
          <span className="font-medium">{uploadError}</span>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100">
              {(profile?.fullName || "C").charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg sm:text-xl">{profile?.fullName || "Candidate"}</h3>
              <p className="text-xs text-slate-500 font-medium">{profile?.title || "Engineer"} · {profile?.yearsOfExperience || 0} років досвіду</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isEditing) handleSaveProfile();
              else setIsEditing(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 transition"
          >
            {isEditing ? (
              <>
                <Save className="w-3.5 h-3.5 text-blue-600" />
                <span>Зберегти зміни</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Редагувати профіль</span>
              </>
            )}
          </button>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/60">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ім'я</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Посада</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Років досвіду</label>
              <input
                type="number"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 bg-white"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Про себе (Summary)</label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 font-sans bg-white"
              />
            </div>
          </div>
        ) : (
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Professional Summary
            </span>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {profile?.summary || "Немає вказаного опису. Натисніть 'Редагувати профіль' або завантажте резюме."}
            </p>
          </div>
        )}

        {/* Skills Tag Cloud */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Підтверджені навички ({skillsList.length})
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {skillsList.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/70"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-slate-400 hover:text-rose-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {skillsList.length === 0 && (
              <span className="text-xs text-slate-400">Навички не додані.</span>
            )}
          </div>

          {/* Add skill form */}
          <form onSubmit={handleAddSkill} className="flex gap-2 max-w-sm">
            <input
              type="text"
              placeholder="Додати навичку (напр. GraphQL, AWS)..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Додати</span>
            </button>
          </form>
        </div>

        {/* Experience List */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
            Історія роботи (Experience)
          </span>
          <div className="space-y-4">
            {experiencesList.map((exp: ExperienceItem) => (
              <div key={exp.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{exp.position}</h4>
                    <span className="text-xs text-slate-500 font-medium">{exp.company}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 px-3 py-0.5 rounded-full bg-white border border-slate-200">
                    {exp.period}
                  </span>
                </div>
                {Array.isArray(exp.description) && (
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                    {exp.description.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {experiencesList.length === 0 && (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Історія роботи порожня. Завантажте файл резюме (PDF/DOCX), щоб автоматично витягнути досвід.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
