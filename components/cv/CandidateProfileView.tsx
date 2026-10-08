"use client";

import React, { useState, useEffect } from "react";
import { CandidateProfile, ExperienceItem } from "@/types";
import { User, Briefcase, Plus, X, UploadCloud, CheckCircle2, Edit3, Save, Trash2 } from "lucide-react";
import { translations, Language } from "@/lib/translations";

interface CandidateProfileViewProps {
  profile: CandidateProfile;
  onUpdateProfile: (updated: CandidateProfile) => void;
  lang?: Language;
}

export function CandidateProfileView({ 
  profile, 
  onUpdateProfile, 
  lang = "ua" 
}: CandidateProfileViewProps) {
  const t = translations[lang].profile;

  const [newSkill, setNewSkill] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [title, setTitle] = useState(profile?.title || "");
  const [years, setYears] = useState(profile?.yearsOfExperience || 3);
  const [summary, setSummary] = useState(profile?.summary || "");

  // Experience CRUD state
  const [isAddingExp, setIsAddingExp] = useState(false);
  const [newExp, setNewExp] = useState({ position: "", company: "", period: "", description: "" });
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editExp, setEditExp] = useState({ position: "", company: "", period: "", description: "" });

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

  // Dynamic Profile Completeness calculation
  const completeness = React.useMemo(() => {
    let score = 0;
    if (profile?.fullName?.trim()) score += 15;
    if (profile?.title?.trim()) score += 15;
    if (profile?.summary?.trim() && profile.summary.trim().length > 10) score += 20;
    if (skillsList.length >= 3) score += 25;
    else if (skillsList.length > 0) score += 15;
    if (experiencesList.length > 0) score += 25;

    const percentage = Math.min(100, score);
    return {
      percentage,
      isComplete: percentage === 100,
    };
  }, [profile?.fullName, profile?.title, profile?.summary, skillsList.length, experiencesList.length]);

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

  // Experience Handlers
  const handleSaveNewExp = () => {
    if (!newExp.position.trim() || !newExp.company.trim()) return;
    const bullets = newExp.description
      .split("\n")
      .map(b => b.replace(/^[\s•\-\*]+/, "").trim())
      .filter(Boolean);

    const created: ExperienceItem = {
      id: "exp-" + Date.now(),
      position: newExp.position.trim(),
      company: newExp.company.trim(),
      period: newExp.period.trim() || "Present",
      description: bullets.length > 0 ? bullets : ["Розробка функціоналу та системна інтеграція"],
      technologies: [],
    };

    onUpdateProfile({
      ...profile,
      experiences: [created, ...experiencesList]
    });

    setIsAddingExp(false);
    setNewExp({ position: "", company: "", period: "", description: "" });
  };

  const handleStartEditExp = (exp: ExperienceItem) => {
    setEditingExpId(exp.id);
    setEditExp({
      position: exp.position,
      company: exp.company,
      period: exp.period,
      description: Array.isArray(exp.description) ? exp.description.join("\n") : "",
    });
  };

  const handleSaveEditExp = (id: string) => {
    const bullets = editExp.description
      .split("\n")
      .map(b => b.replace(/^[\s•\-\*]+/, "").trim())
      .filter(Boolean);

    const updatedList = experiencesList.map(exp => {
      if (exp.id === id) {
        return {
          ...exp,
          position: editExp.position.trim() || exp.position,
          company: editExp.company.trim() || exp.company,
          period: editExp.period.trim() || exp.period,
          description: bullets.length > 0 ? bullets : exp.description,
        };
      }
      return exp;
    });

    onUpdateProfile({
      ...profile,
      experiences: updatedList
    });

    setEditingExpId(null);
  };

  const handleDeleteExp = (id: string) => {
    const updatedList = experiencesList.filter(exp => exp.id !== id);
    onUpdateProfile({
      ...profile,
      experiences: updatedList
    });
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

      const parsed = data.profile;
      setFullName(parsed.fullName || "");
      setTitle(parsed.title || "");
      setYears(parsed.yearsOfExperience || 3);
      setSummary(parsed.summary || "");

      onUpdateProfile(parsed);
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
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{t.title}</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t.subtitle}
          </p>
        </div>

        {/* Upload new CV button */}
        <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-blue-600 transition shadow-xs self-start sm:self-auto ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <UploadCloud className="w-4 h-4" />
          <span>{isUploading ? t.uploading : t.uploadBtn}</span>
          <input 
            type="file" 
            accept=".pdf,.docx,.txt" 
            onChange={handleFileUpload} 
            className="hidden" 
            disabled={isUploading}
          />
        </label>
      </div>

      {uploadError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 animate-in fade-in flex items-center justify-between">
          <span>⚠ {uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 animate-in fade-in flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {uploadSuccess}
          </span>
          <button onClick={() => setUploadSuccess(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Profile Completeness Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-700">{t.completeness}</span>
          <span className="text-blue-600">{completeness.percentage}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full rounded-full transition-all duration-500" 
            style={{ width: `${completeness.percentage}%` }} 
          />
        </div>
        <p className="text-[11px] text-slate-400">
          {completeness.isComplete ? t.completeHint : t.incompleteHint}
        </p>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100">
              {profile?.fullName ? profile.fullName.charAt(0) : "U"}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {profile?.fullName || "Candidate"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {profile?.title || "Software Engineer"} · {profile?.yearsOfExperience || 0} {t.yearsExp.toLowerCase()}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isEditing) handleSaveProfile();
              else setIsEditing(true);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs self-start sm:self-auto ${
              isEditing 
                ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {isEditing ? (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{t.saveProfile}</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t.editProfile}</span>
              </>
            )}
          </button>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/60">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.name}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.role}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.yearsExp}</label>
              <input
                type="number"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 bg-white"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.summary}</label>
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
              {t.summary}
            </span>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {profile?.summary || t.summaryPlaceholder}
            </p>
          </div>
        )}

        {/* Skills Tag Cloud */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t.skillsTitle} ({skillsList.length})
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
              <span className="text-xs text-slate-400">{t.noSkills}</span>
            )}
          </div>

          {/* Add skill form */}
          <form onSubmit={handleAddSkill} className="flex gap-2 max-w-sm">
            <input
              type="text"
              placeholder={t.addSkillPlaceholder}
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addSkillBtn}</span>
            </button>
          </form>
        </div>

        {/* Experience Section with CRUD */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t.experienceTitle} ({experiencesList.length})
            </span>
            {!isAddingExp && (
              <button
                type="button"
                onClick={() => setIsAddingExp(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 transition border border-transparent hover:border-blue-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addExperienceBtn}</span>
              </button>
            )}
          </div>

          {/* Form: Add New Experience */}
          {isAddingExp && (
            <div className="mb-4 p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3 animate-in fade-in">
              <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900">
                {t.addExperienceBtn}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.posLabel}</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior .NET Engineer"
                    value={newExp.position}
                    onChange={(e) => setNewExp({ ...newExp, position: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.compLabel}</label>
                  <input
                    type="text"
                    placeholder="e.g. Murano Software"
                    value={newExp.company}
                    onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.periodLabel}</label>
                  <input
                    type="text"
                    placeholder="e.g. 2021 — Present"
                    value={newExp.period}
                    onChange={(e) => setNewExp({ ...newExp, period: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.bulletsLabel}</label>
                <textarea
                  rows={3}
                  placeholder="• Розробка мікросервісів на .NET Core&#10;• Оптимізація запитів MSSQL&#10;• Впровадження CI/CD пайплайнів"
                  value={newExp.description}
                  onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white leading-relaxed font-sans"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveNewExp}
                  disabled={!newExp.position.trim() || !newExp.company.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.saveExp}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingExp(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}

          {/* List of Experiences */}
          <div className="space-y-4">
            {experiencesList.map((exp: ExperienceItem) => {
              const isCurrentlyEditing = editingExpId === exp.id;

              if (isCurrentlyEditing) {
                return (
                  <div key={exp.id} className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3 animate-in fade-in">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                      {t.editExpBtn}: {exp.company}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.posLabel}</label>
                        <input
                          type="text"
                          value={editExp.position}
                          onChange={(e) => setEditExp({ ...editExp, position: e.target.value })}
                          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.compLabel}</label>
                        <input
                          type="text"
                          value={editExp.company}
                          onChange={(e) => setEditExp({ ...editExp, company: e.target.value })}
                          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.periodLabel}</label>
                        <input
                          type="text"
                          value={editExp.period}
                          onChange={(e) => setEditExp({ ...editExp, period: e.target.value })}
                          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.bulletsLabel}</label>
                      <textarea
                        rows={3}
                        value={editExp.description}
                        onChange={(e) => setEditExp({ ...editExp, description: e.target.value })}
                        className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white leading-relaxed font-sans"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveEditExp(exp.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{t.saveExp}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingExpId(null)}
                        className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={exp.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2 group hover:border-slate-300 transition">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{exp.position}</h4>
                      <span className="text-xs text-slate-500 font-medium">{exp.company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 px-3 py-0.5 rounded-full bg-white border border-slate-200">
                        {exp.period}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartEditExp(exp)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition"
                        title={t.editExpBtn}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExp(exp.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                        title={t.deleteExpBtn}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {Array.isArray(exp.description) && (
                    <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                      {exp.description.map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            {experiencesList.length === 0 && !isAddingExp && (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                {t.emptyExp}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
