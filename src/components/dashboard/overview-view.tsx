"use client";

import React from "react";
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  UserCheck,
  TrendingUp,
  Building2,
  CalendarCheck,
  ShieldAlert,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface OverviewViewProps {
  onSelectTicket: (id: number) => void;
}

export function OverviewView({ onSelectTicket }: OverviewViewProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("تعذر جلب بيانات لوحة التحكم");
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        جاري تحميل مؤشرات الأداء ولوحة التحكم...
      </div>
    );
  }

  const kpis = [
    {
      title: "إجمالي التذاكر",
      value: data?.total ?? 0,
      icon: Inbox,
      color: "text-slate-700 dark:text-slate-200",
      bg: "bg-slate-100 dark:bg-slate-800",
    },
    {
      title: "تذاكر جديدة",
      value: data?.newTickets ?? 0,
      icon: AlertCircle,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "قيد المعالجة",
      value: data?.inProgress ?? 0,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      title: "بانتظار الموظف",
      value: data?.waitingEmployee ?? 0,
      icon: Clock,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      title: "تم الحل",
      value: data?.resolved ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: "حُلّت اليوم",
      value: data?.resolvedToday ?? 0,
      icon: CalendarCheck,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/40",
    },
    {
      title: "غير مسندة",
      value: data?.unassigned ?? 0,
      icon: ShieldAlert,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
    },
    {
      title: "بانتظار الاعتماد",
      value: data?.pendingAccounts ?? 0,
      icon: UserCheck,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  {kpi.title}
                </span>
                <span className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</span>
              </div>
              <div className={`p-3 rounded-xl ${kpi.bg}`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* SLA & Performance Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-linear-to-br from-brand-900 to-brand-950 text-white shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand-200 text-xs font-semibold mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>معدل الالتزام باتفاقية SLA</span>
            </div>
            <div className="text-4xl font-black">{data?.onTimePercent ?? 100}%</div>
            <p className="text-xs text-brand-200 mt-2">
              نسبة التذاكر التي تم حلها وإنجازها ضمن الساعات المحددة لكل مستوى أولوية.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-brand-800/80 flex justify-between text-xs">
            <span>التذاكر المتأخرة حالياً:</span>
            <strong className="text-rose-300 font-bold">{data?.overdueCount ?? 0} تذكرة</strong>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-4">
            <Clock className="w-4 h-4 text-brand-800 dark:text-brand-400" />
            <span>متوسط وقت الحل</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {data?.averageResolutionHours ?? 0} <span className="text-sm font-normal text-slate-400">ساعة</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            متوسط الزمن المستغرق من لحظة فتح التذكرة وحتى اعتماد حلها مع استبعاد فترات التعليق المبررة.
          </p>
        </div>

        {/* Status Breakdown Bar */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">توزيع الحالات</h3>
          <div className="space-y-2.5">
            {data?.byStatus?.map((item: any) => (
              <div key={item.key} className="text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                  <span>{item.status}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.count}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-800 h-full rounded-full transition-all"
                    style={{
                      width: `${data.total > 0 ? (item.count / data.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delay Reasons & Department breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Delays */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white mb-4">أسباب تعليق التذاكر الأخيرة</h3>
          {data?.delayReasons?.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-6">لا توجد أسباب تعليق مسجلة</div>
          ) : (
            <div className="space-y-3">
              {data.delayReasons.map((d: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => onSelectTicket(d.ticketId)}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs hover:bg-slate-100 cursor-pointer transition"
                >
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                    <span className="font-bold text-brand-800 dark:text-brand-400">#{d.ticketId} {d.ticketTitle}</span>
                    <span>{new Date(d.createdAt).toLocaleDateString("ar-SA")}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{d.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Department */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-brand-800" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-white">الطلبات حسب الأقسام</h3>
          </div>
          <div className="space-y-3">
            {data?.byDepartment?.map((dept: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{dept.department}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-800 dark:text-brand-400 font-bold">
                  {dept.count} تذكرة
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
