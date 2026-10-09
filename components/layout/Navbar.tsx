"use client";

import React, { useState, useRef, useEffect } from "react";
import { Compass, Briefcase, Sparkles, User, ChevronRight, ChevronDown, Check, Plus } from "lucide-react";
import { CandidateProfile } from "@/types";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeCandidate: CandidateProfile;
  candidates?: CandidateProfile[];
  onSelectCandidate?: (id: string) => void;
  onCreateCandidate?: () => void;
  lang?: "ua" | "en";
  setLang?: (l: "ua" | "en") => void;
}

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  activeCandidate,
  candidates = [],
  onSelectCandidate,
  onCreateCandidate,
  lang = "ua",
  setLang
}: NavbarProps) {
  const isEn = lang === "en";
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Only core workflow items in the main navigation
  const navItems = [
    { id: "dashboard", label: isEn ? "Dashboard" : "Дашборд", icon: Compass },
    { id: "analyze", label: isEn ? "Analyze Job" : "Аналіз вакансії", icon: Sparkles },
    { id: "tracker", label: isEn ? "Applications" : "Трекер заявок", icon: Briefcase },
  ];

  const isProfileActive = activeTab === "profile";

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => setActiveTab("dashboard")}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-600 transition">
              <Sparkles className="w-4 h-4 text-blue-400 group-hover:text-white transition" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">JobPilot</span>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                {isEn ? "Know if you're a fit. Apply with confidence." : "Оціни шанси на вакансію та подавайся впевнено."}
              </p>
            </div>
          </div>

          {/* Core Workflow Tabs */}
          <nav className="flex space-x-1 sm:space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
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

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            {setLang && (
              <div className="flex items-center bg-slate-100 rounded-xl p-0.5 text-xs font-bold border border-slate-200">
                <button
                  onClick={() => setLang("ua")}
                  className={`px-2 py-1 rounded-lg transition ${
                    lang === "ua"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Українська версія"
                >
                  UA
                </button>
                <button
                  onClick={() => setLang("en")}
                  className={`px-2 py-1 rounded-lg transition ${
                    lang === "en"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="English version"
                >
                  EN
                </button>
              </div>
            )}

            {/* Profile Dropdown Container */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-full border transition ${
                  isProfileActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
                title={isEn ? "Switch or view profile" : "Перемкнути або відкрити профіль"}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  isProfileActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                }`}>
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold leading-none">
                    {activeCandidate.fullName.split(" ")[0]}
                  </span>
                  <span className={`text-[10px] font-medium leading-tight mt-0.5 truncate max-w-[100px] ${
                    isProfileActive ? "text-slate-300" : "text-slate-400"
                  }`}>
                    {activeCandidate.title.split("/")[0].trim()}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                } ${isProfileActive ? "text-slate-300" : "text-slate-400"}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {isEn ? "Candidate Profiles" : "Профілі кандидатів"}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {candidates.length}
                    </span>
                  </div>

                  {/* Candidates List */}
                  <div className="max-h-60 overflow-y-auto py-1 divide-y divide-slate-50">
                    {candidates.map((c) => {
                      const isActive = c.id === activeCandidate.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            if (onSelectCandidate) onSelectCandidate(c.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50 transition ${
                            isActive ? "bg-blue-50/60" : ""
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{c.fullName}</span>
                              {isActive && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                  {isEn ? "Active" : "Активний"}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {c.title} • {c.yearsOfExperience}+ {isEn ? "yrs" : "р."}
                            </div>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="border-t border-slate-100 p-1.5 space-y-1">
                    {onCreateCandidate && (
                      <button
                        onClick={() => {
                          onCreateCandidate();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 transition flex items-center gap-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isEn ? "+ Add New Profile" : "+ Створити новий профіль"}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActiveTab("profile");
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition flex items-center justify-between"
                    >
                      <span>{isEn ? "Open Profile Settings" : "Налаштувати профіль"}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
