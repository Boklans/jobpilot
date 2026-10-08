"use client";

import React from "react";
import { ApplicationTrackerItem, ApplicationStatus } from "@/types";
import { Building, Trash2 } from "lucide-react";
import { translations, Language } from "@/lib/translations";

interface TrackerBoardProps {
  applications: ApplicationTrackerItem[];
  onUpdateStatus: (id: string, newStatus: ApplicationStatus) => void;
  onDeleteApplication: (id: string) => void;
  lang?: Language;
}

export function TrackerBoard({
  applications,
  onUpdateStatus,
  onDeleteApplication,
  lang = "ua",
}: TrackerBoardProps) {
  const t = translations[lang].tracker;

  const COLUMNS: { id: ApplicationStatus; title: string; color: string; badge: string }[] = [
    { id: "saved", title: t.columns.saved, color: "border-slate-300", badge: "bg-slate-100 text-slate-700" },
    { id: "applied", title: t.columns.applied, color: "border-blue-400", badge: "bg-blue-100 text-blue-700" },
    { id: "interview", title: t.columns.interview, color: "border-purple-400", badge: "bg-purple-100 text-purple-700" },
    { id: "offer", title: t.columns.offer, color: "border-emerald-400", badge: "bg-emerald-100 text-emerald-800" },
    { id: "rejected", title: t.columns.rejected, color: "border-rose-300", badge: "bg-rose-100 text-rose-700" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t.pipelineTitle}</h2>
          <p className="text-sm text-slate-500">
            {t.pipelineSub}
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
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
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
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

                    {app.job.salary && (
                      <div className="text-xs font-semibold text-emerald-700">
                        {app.job.salary}
                      </div>
                    )}

                    {app.notes && (
                      <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-100">
                        {app.notes}
                      </div>
                    )}

                    {/* Quick Move Status Selector */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
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

                      <button
                        onClick={() => onDeleteApplication(app.id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title={t.deleteTooltip}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
    </div>
  );
}
