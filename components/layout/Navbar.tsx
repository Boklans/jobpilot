"use client";

import React from "react";
import { Compass, Briefcase, FileText, Sparkles, User, ChevronRight } from "lucide-react";
import { CandidateProfile } from "@/types";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeCandidate: CandidateProfile;
}

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  activeCandidate 
}: NavbarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Compass },
    { id: "analyze", label: "Analyze Job", icon: Sparkles },
    { id: "tracker", label: "Applications", icon: Briefcase },
    { id: "profile", label: "Candidate Profile", icon: FileText },
  ];

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
                Know if you're a fit. Apply with confidence.
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-1 sm:space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Profile Quick Pill */}
          <button
            onClick={() => setActiveTab("profile")}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition bg-white"
          >
            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-none">
                {activeCandidate.fullName.split(" ")[0]}
              </span>
              <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                Profile
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
