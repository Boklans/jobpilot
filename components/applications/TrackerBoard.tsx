"use client";

import React, { useState } from "react";
import { ApplicationTrackerItem, ApplicationStatus, CandidateProfile } from "@/types";
import { 
  Building, 
  Trash2, 
  Calendar, 
  DollarSign, 
  User, 
  FileText, 
  Mail, 
  Edit3, 
  X, 
  Check, 
  Copy, 
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { translations, Language } from "@/lib/translations";
import { TailoredCVModal } from "@/components/cv/TailoredCVModal";

interface TrackerBoardProps {
  applications: ApplicationTrackerItem[];
  onUpdateStatus: (id: string, newStatus: ApplicationStatus) => void;
  onUpdateApplication?: (updatedApp: ApplicationTrackerItem) => void;
  onDeleteApplication: (id: string) => void;
  candidate: CandidateProfile;
  lang?: Language;
}

export function TrackerBoard({
  applications,
  onUpdateStatus,
  onUpdateApplication,
  onDeleteApplication,
  candidate,
  lang = "ua",
}: TrackerBoardProps) {
  const t = translations[lang].tracker;
  const isEn = lang === "en";

  // State for Edit CRM Modal
  const [editingApp, setEditingApp] = useState<ApplicationTrackerItem | null>(null);
  const [editStatus, setEditStatus] = useState<ApplicationStatus>("applied");
  const [editInterviewDate, setEditInterviewDate] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // State for Document Viewers
  const [viewingCVApp, setViewingCVApp] = useState<ApplicationTrackerItem | null>(null);
  const [viewingLetterApp, setViewingLetterApp] = useState<ApplicationTrackerItem | null>(null);
  const [copiedLetter, setCopiedLetter] = useState(false);

  const COLUMNS: { id: ApplicationStatus; title: string; color: string; badge: string }[] = [
    { id: "saved", title: t.columns.saved, color: "border-slate-300", badge: "bg-slate-100 text-slate-700" },
    { id: "applied", title: t.columns.applied, color: "border-blue-400", badge: "bg-blue-100 text-blue-700" },
    { id: "interview", title: t.columns.interview, color: "border-purple-400", badge: "bg-purple-100 text-purple-700" },
    { id: "offer", title: t.columns.offer, color: "border-emerald-400", badge: "bg-emerald-100 text-emerald-800" },
    { id: "rejected", title: t.columns.rejected, color: "border-rose-300", badge: "bg-rose-100 text-rose-700" },
  ];

  const handleOpenEdit = (app: ApplicationTrackerItem) => {
    setEditingApp(app);
    setEditStatus(app.status);
    setEditInterviewDate(app.interviewDate || "");
    setEditContact(app.contactPerson || "");
    setEditSalary(app.salaryTarget || app.job.salary || "");
    setEditNotes(app.notes || "");
  };

  const handleSaveEdit = () => {
    if (!editingApp) return;
    const updated: ApplicationTrackerItem = {
      ...editingApp,
      status: editStatus,
      interviewDate: editInterviewDate.trim() || undefined,
      contactPerson: editContact.trim() || undefined,
      salaryTarget: editSalary.trim() || undefined,
      notes: editNotes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    if (onUpdateApplication) {
      onUpdateApplication(updated);
    } else {
      onUpdateStatus(updated.id, editStatus);
    }
    setEditingApp(null);
  };

  const handleCopyLetter = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t.pipelineTitle}</h2>
          <p className="text-sm text-slate-500">
            {t.pipelineSub}
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full self-start sm:self-auto">
          {t.totalApps} {applications.length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colApps = applications.filter((app) => app.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 flex flex-col min-h-[450px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="font-semibold text-xs uppercase tracking-wider text-slate-700">
                  {col.title}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                  {colApps.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colApps.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 
                          onClick={() => handleOpenEdit(app)}
                          className="font-bold text-sm text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition"
                        >
                          {app.job.title}
                        </h4>
                        {app.matchScore && (
                          <span className="text-[11px] font-black px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            {app.matchScore}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.job.company}</span>
                      </div>
                    </div>

                    {/* Metadata Badges: Interview Date, Salary, Contact */}
                    <div className="flex flex-wrap gap-1.5">
                      {app.interviewDate && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                          <Calendar className="w-3 h-3 text-purple-600" />
                          <span>{app.interviewDate}</span>
                        </span>
                      )}

                      {(app.salaryTarget || app.job.salary) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          <span>{app.salaryTarget || app.job.salary}</span>
                        </span>
                      )}

                      {app.contactPerson && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[100px]">{app.contactPerson}</span>
                        </span>
                      )}
                    </div>

                    {/* Attached Documents Quick Access */}
                    {(app.tailoredCV || app.coverLetter) && (
                      <div className="flex items-center gap-1.5 pt-1">
                        {app.tailoredCV && (
                          <button
                            onClick={() => setViewingCVApp(app)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold hover:bg-blue-100 transition"
                            title={t.openAttachedCV}
                          >
                            <FileText className="w-3 h-3" />
                            <span>CV</span>
                          </button>
                        )}
                        {app.coverLetter && (
                          <button
                            onClick={() => setViewingLetterApp(app)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold hover:bg-purple-100 transition"
                            title={t.openAttachedLetter}
                          >
                            <Mail className="w-3 h-3" />
                            <span>Letter</span>
                          </button>
                        )}
                      </div>
                    )}

                    {app.notes && (
                      <div 
                        onClick={() => handleOpenEdit(app)}
                        className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition line-clamp-2"
                      >
                        {app.notes}
                      </div>
                    )}

                    {/* Quick Move Status Selector & Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-1">
                      <select
                        value={app.status}
                        onChange={(e) => onUpdateStatus(app.id, e.target.value as ApplicationStatus)}
                        className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-hidden"
                      >
                        <option value="saved">{t.columns.saved}</option>
                        <option value="applied">{t.columns.applied}</option>
                        <option value="interview">{t.columns.interview}</option>
                        <option value="offer">{t.columns.offer}</option>
                        <option value="rejected">{t.columns.rejected}</option>
                      </select>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(app)}
                          className="text-slate-400 hover:text-blue-600 transition p-1 rounded hover:bg-slate-50"
                          title={t.editDetails}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteApplication(app.id)}
                          className="text-slate-400 hover:text-rose-600 transition p-1 rounded hover:bg-slate-50"
                          title={t.deleteTooltip}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {colApps.length === 0 && (
                  <div className="h-28 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400">
                    {t.emptyCol}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CRM Edit Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  {t.editModalTitle}
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  {editingApp.job.title} — {editingApp.job.company}
                </h3>
              </div>
              <button
                onClick={() => setEditingApp(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {t.statusLabel}
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ApplicationStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                >
                  <option value="saved">{t.columns.saved}</option>
                  <option value="applied">{t.columns.applied}</option>
                  <option value="interview">{t.columns.interview}</option>
                  <option value="offer">{t.columns.offer}</option>
                  <option value="rejected">{t.columns.rejected}</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {t.interviewDate}
                  </label>
                  <input
                    type="text"
                    value={editInterviewDate}
                    onChange={(e) => setEditInterviewDate(e.target.value)}
                    placeholder={t.interviewDatePlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {t.salaryTarget}
                  </label>
                  <input
                    type="text"
                    value={editSalary}
                    onChange={(e) => setEditSalary(e.target.value)}
                    placeholder={t.salaryPlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {t.contactPerson}
                </label>
                <input
                  type="text"
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                  placeholder={t.contactPlaceholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {t.notesLabel}
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder={t.notesPlaceholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 leading-relaxed"
                />
              </div>

              {/* Attached Documents in Modal */}
              {(editingApp.tailoredCV || editingApp.coverLetter) && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">
                    {t.attachedBadge}:
                  </span>
                  <div className="flex items-center gap-2">
                    {editingApp.tailoredCV && (
                      <button
                        onClick={() => {
                          setViewingCVApp(editingApp);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold text-[11px] hover:bg-blue-700 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>CV</span>
                      </button>
                    )}
                    {editingApp.coverLetter && (
                      <button
                        onClick={() => {
                          setViewingLetterApp(editingApp);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white font-semibold text-[11px] hover:bg-slate-800 transition"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Letter</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingApp(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
              >
                {t.cancelBtn}
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition shadow-2xs"
              >
                {t.saveDetails}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attached CV Modal */}
      {viewingCVApp && viewingCVApp.tailoredCV && (
        <TailoredCVModal
          isOpen={true}
          onClose={() => setViewingCVApp(null)}
          candidate={candidate}
          job={viewingCVApp.job}
          tailoredCV={viewingCVApp.tailoredCV}
        />
      )}

      {/* Attached Cover Letter Quick View Modal */}
      {viewingLetterApp && viewingLetterApp.coverLetter && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {viewingLetterApp.job.title} — {viewingLetterApp.job.company}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Cover Letter</span>
                </div>
              </div>
              <button
                onClick={() => setViewingLetterApp(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewingLetterApp.coverLetter.subjectLine && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Subject:</span>
                <p className="font-semibold text-slate-900 select-all font-mono">{viewingLetterApp.coverLetter.subjectLine}</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans">
              {viewingLetterApp.coverLetter.content}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                {viewingLetterApp.coverLetter.content.length} {isEn ? "chars" : "символів"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyLetter(viewingLetterApp.coverLetter!.content)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                >
                  {copiedLetter ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLetter ? (isEn ? "Copied!" : "Скопійовано!") : (isEn ? "Copy Letter" : "Скопіювати лист")}</span>
                </button>
                <button
                  onClick={() => setViewingLetterApp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  {isEn ? "Close" : "Закрити"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

