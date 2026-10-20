"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Moon,
  Sun,
  User,
  LogOut,
  KeyRound,
  Check,
  CheckCheck,
  ChevronDown,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TopbarProps {
  user: {
    id: number;
    fullName: string;
    titlePrefix?: string;
    displayName: string;
    role: string;
    department?: string | null;
  };
  currentTabTitle: string;
  onOpenChangePassword: () => void;
  onLogout: () => void;
}

export function Topbar({
  user,
  currentTabTitle,
  onOpenChangePassword,
  onLogout,
}: TopbarProps) {
  const queryClient = useQueryClient();
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Initialize theme
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("itdesk_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("itdesk_theme", "light");
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notifications query with polling every 30 seconds
  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return { notifications: [], unreadCount: 0 };
      return res.json();
    },
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id?: number) => {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  const roleLabels: Record<string, string> = {
    Admin: "مدير النظام",
    IT: "الدعم الفني",
    User: "مستخدم",
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Title / Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-700 dark:text-slate-300">بوابة الدعم</span>
        <span className="text-slate-400">/</span>
        <h1 className="font-bold text-slate-900 dark:text-white text-base">{currentTabTitle}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
            aria-label="الإشعارات"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800 dark:text-white">الإشعارات</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markReadMutation.mutate(undefined)}
                    className="text-xs text-brand-800 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>تحديد الكل كمقروء</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">لا توجد إشعارات حالياً</div>
                ) : (
                  notifications.map((n: any) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                      className={`p-3.5 text-xs transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        !n.isRead ? "bg-brand-50/40 dark:bg-brand-950/20 font-medium" : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <p className="text-slate-800 dark:text-slate-200">{n.text}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
          aria-label="تغيير المظهر"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                {user.displayName}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {roleLabels[user.role] || user.role} {user.department ? `• ${user.department}` : ""}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-brand-800 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {user.fullName.charAt(0)}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="block text-xs font-bold text-slate-800 dark:text-white">{user.displayName}</span>
                <span className="block text-[11px] text-slate-400 truncate">{user.role}</span>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenChangePassword();
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <KeyRound className="w-4 h-4 text-slate-400" />
                <span>تغيير كلمة المرور</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition border-t border-slate-100 dark:border-slate-800"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
