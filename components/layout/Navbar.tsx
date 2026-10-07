"use client";

import React from "react";
import { Compass, Briefcase, Sparkles, User, ChevronRight } from "lucide-react";
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
  // Only core workflow items in the main navigation
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Compass },
    { id: "analyze", label: "Analyze Job", icon: Sparkles },
    { id: "tracker", label: "Applications", icon: Briefcase },
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
                Know if you're a fit. Apply with confidence.
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
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
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

          {/* Profile Button on the right */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border transition ${
              isProfileActive
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
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
              <span className={`text-[10px] font-medium leading-tight mt-0.5 ${
                isProfileActive ? "text-slate-300" : "text-slate-400"
              }`}>
                CV Profile
              </span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 hidden sm:block ${
              isProfileActive ? "text-slate-300" : "text-slate-400"
            }`} />
          </button>
        </div>
      </div>
    </header>
  );
}
