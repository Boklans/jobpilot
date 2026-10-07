"use client";

import React, { useState } from "react";
import { Compass, Briefcase, FileText, CheckCircle2, User, Sparkles, ChevronDown, Plus, Users } from "lucide-react";
import { CandidateProfile } from "@/types";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  candidates: CandidateProfile[];
  activeCandidate: CandidateProfile;
  onSelectCandidate: (id: string) => void;
  onAddNewCandidate: () => void;
}

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  candidates, 
  activeCandidate, 
  onSelectCandidate,
  onAddNewCandidate
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>("JobPilot AI");
  const [hasLiveLLM, setHasLiveLLM] = useState(false);

  React.useEffect(() => {
    fetch("/api/ai/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.activeEngine) {
          setAiStatus(data.activeEngine);
          setHasLiveLLM(Boolean(data.hasLiveLLM));
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Compass },
    { id: "analyze", label: "Analyze Job", icon: Sparkles },
    { id: "tracker", label: "Applications", icon: Briefcase },
    { id: "profile", label: "Candidate CV", icon: FileText },
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">JobPilot</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  hasLiveLLM
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasLiveLLM ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                  {aiStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Apply Smarter · Get Hired</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Candidate Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition bg-white shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-100">
                {activeCandidate.fullName.charAt(0)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {activeCandidate.fullName}
                </span>
                <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                  {activeCandidate.title.split("/")[0]}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Твої кандидати ({candidates.length})
                    </span>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onAddNewCandidate();
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Новий
                    </button>
                  </div>

                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {candidates.map((cand) => {
                      const isSelected = cand.id === activeCandidate.id;
                      return (
                        <div
                          key={cand.id}
                          onClick={() => {
                            onSelectCandidate(cand.id);
                            setDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition text-xs ${
                            isSelected
                              ? "bg-blue-50/80 text-blue-900 font-semibold"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                            }`}>
                              {cand.fullName.charAt(0)}
                            </div>
                            <div className="truncate">
                              <p className="leading-snug truncate">{cand.fullName}</p>
                              <p className="text-[10px] text-slate-400 truncate">{cand.title}</p>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 mt-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setActiveTab("profile");
                      }}
                      className="w-full text-center py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition"
                    >
                      Переглянути поточне резюме →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
