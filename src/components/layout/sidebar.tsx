"use client";

import React from "react";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  Building2,
  GitFork,
  Settings,
  History,
  LogOut,
  Headphones,
  CheckCircle2,
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
  onOpenNewTicket: () => void;
  systemName?: string;
  logoPath?: string;
}

export function Sidebar({
  currentTab,
  onTabChange,
  userRole,
  onOpenNewTicket,
  systemName = "IT Desk",
  logoPath = "/logo-placeholder.svg",
}: SidebarProps) {
  const isItOrAdmin = userRole === "IT" || userRole === "Admin";
  const isAdmin = userRole === "Admin";

  const navItems = [
    ...(isItOrAdmin
      ? [
          {
            id: "overview",
            label: "نظرة عامة",
            icon: LayoutDashboard,
          },
        ]
      : []),
    {
      id: "tickets",
      label: "جميع التذاكر",
      icon: Ticket,
    },
    ...(isItOrAdmin
      ? [
          {
            id: "team",
            label: "فريق الدعم والمهام",
            icon: Headphones,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            id: "users",
            label: "إدارة المستخدمين",
            icon: Users,
          },
          {
            id: "departments",
            label: "الأقسام",
            icon: Building2,
          },
          {
            id: "rules",
            label: "قواعد الإسناد",
            icon: GitFork,
          },
          {
            id: "settings",
            label: "إعدادات النظام",
            icon: Settings,
          },
          {
            id: "activity",
            label: "سجل العمليات",
            icon: History,
          },
        ]
      : []),
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 select-none transition-colors">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-brand-800/10 dark:bg-brand-500/10 flex items-center justify-center p-1.5 shrink-0">
          <img src={logoPath || "/logo-placeholder.svg"} alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">{systemName}</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">بوابة طلبات الدعم</span>
        </div>
      </div>

      {/* Quick Action */}
      <div className="p-4">
        <button
          onClick={onOpenNewTicket}
          className="w-full flex items-center justify-center gap-2 bg-brand-800 hover:bg-brand-900 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm transition-all transform active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          <span>إنشاء تذكرة جديدة</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          القائمة الرئيسية
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand-50 dark:bg-brand-950/40 text-brand-800 dark:text-brand-400 font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-brand-800 dark:text-brand-400" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="font-medium">النظام يعمل بصورة طبيعية</span>
        </div>
      </div>
    </aside>
  );
}
