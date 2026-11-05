"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface EmployeeStat {
  id: number;
  fullName: string;
  role: string;
  department: string | null;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
}

interface AnalyticsResponse {
  employees: EmployeeStat[];
  summary: {
    totalTasks: number;
    totalCompleted: number;
    totalPending: number;
    totalOverdue: number;
  };
  myId: number;
  isItOrAdmin: boolean;
  canViewAll: boolean;
}

export const AnalyticsView = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("search", search);
      const res = await fetch("/api/tasks/analytics?" + params.toString(), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("فشل تحميل إحصائيات المهام");
      const json = (await res.json()) as AnalyticsResponse;
      setData(json);
    } catch (e: any) {
      setError(e.message || "حدث خطأ أثناء تحميل الإحصائيات");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, [search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-slate-400 animate-spin"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          </svg>
          <span className="text-sm font-semibold">جاري تحميل إحصائيات المهام...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen p-6">
        <div className="text-center text-rose-600">
          <h3 className="mb-4">حدث خطأ</h3>
          <p>{error || "فشل تحميل إحصائيات المهام. يرجى المحاولة مرة أخرى."}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-brand-800 text-white rounded-md hover:bg-brand-900"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  if (!data) return null;
  const employees = data!.employees || [];
  const canViewAll = data!.canViewAll;
  const myId = data!.myId;
  const s = data!.summary;

  const showSearch = canViewAll;
  const displayedEmployees = canViewAll ? employees : employees.filter((e) => e.id === myId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">إحصائيات المهام</h1>
            <p className="text-slate-600 dark:text-slate-400">
              عرض إحصائيات المهام لكل موظف بناءً على البيانات الفعلية في قاعدة البيانات.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">إجمالي المهام</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.totalTasks}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">مكتملة</p>
            <p className="text-2xl font-bold text-emerald-600">{s.totalCompleted}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">قيد الانتظار</p>
            <p className="text-2xl font-bold text-amber-600">{s.totalPending}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">متأخرة</p>
            <p className="text-2xl font-bold text-rose-600">{s.totalOverdue}</p>
          </div>
        </div>

        {showSearch && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="البحث عن موظف بالاسم..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800 text-slate-900 dark:text-white"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              يمكنك البحث عن موظف باسمه لعرض إحصائيات مهامه فقط.
            </p>
          </div>
        )}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">الموظف</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">القسم</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">الدور</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">الإجمالي</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">مكتملة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">قيد الانتظار</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">متأخرة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">نسبة الإنجاز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {displayedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    لا توجد موظفين يطابقون البحث.
                  </td>
                </tr>
              ) : (
                displayedEmployees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">{e.fullName}</span>
                        {e.id === myId && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">أنا</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.department || "-"}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {e.role === "Admin" ? "مسؤول" : e.role === "IT" ? "دعم فني" : "مستخدم"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800 dark:text-slate-200">{e.totalTasks}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600">{e.completedTasks}</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-600">{e.pendingTasks}</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-600">{e.overdueTasks}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(e.completionRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{e.completionRate}%</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!canViewAll && (
          <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              أنت تشاهد إحصائيات مهامك فقط. المسؤول والمخولون يمكنهم عرض إحصائيات جميع الموظفين.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
  }