"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  PlusCircle,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { calculateSlaStatus } from "@/lib/sla";

interface TicketsListViewProps {
  onSelectTicket: (id: number) => void;
  onOpenNewTicket: () => void;
  categories: Array<{ id: number; name: string }>;
  staff: Array<{ id: number; fullName: string; displayName: string }>;
  userRole: string;
  slaHours: { urgent: number; high: number; medium: number; low: number };
}

export function TicketsListView({
  onSelectTicket,
  onOpenNewTicket,
  categories,
  staff,
  userRole,
  slaHours,
}: TicketsListViewProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [scope, setScope] = useState("all");

  const isItOrAdmin = userRole === "IT" || userRole === "Admin";

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", { search, status, priority, categoryId, scope }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      if (priority !== "all") params.set("priority", priority);
      if (categoryId !== "all") params.set("categoryId", categoryId);
      if (scope !== "all") params.set("scope", scope);

      const res = await fetch(`/api/tickets?${params.toString()}`);
      return res.json();
    },
    refetchInterval: 20000,
  });

  const tickets = data?.tickets || [];

  const statusMap: Record<string, { label: string; bg: string; text: string }> = {
    New: { label: "جديدة", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400" },
    InProgress: { label: "قيد المعالجة", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400" },
    WaitingEmployee: { label: "بانتظار الموظف", bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-400" },
    Resolved: { label: "تم الحل", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400" },
    Closed: { label: "مغلقة", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
  };

  const priorityMap: Record<string, { label: string; badge: string }> = {
    Urgent: { label: "حرجة", badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 font-bold" },
    High: { label: "مرتفعة", badge: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400" },
    Medium: { label: "متوسطة", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" },
    Low: { label: "منخفضة", badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  };

  return (
    <div className="space-y-4">
      {/* Header and Scope Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Scope Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-2xl w-fit text-xs font-semibold">
          <button
            onClick={() => setScope("all")}
            className={`px-3 py-1.5 rounded-xl transition ${
              scope === "all" ? "bg-white dark:bg-slate-900 text-brand-800 dark:text-brand-400 shadow-xs" : "text-slate-500"
            }`}
          >
            جميع التذاكر
          </button>
          {isItOrAdmin && (
            <button
              onClick={() => setScope("my_assigned")}
              className={`px-3 py-1.5 rounded-xl transition ${
                scope === "my_assigned" ? "bg-white dark:bg-slate-900 text-brand-800 dark:text-brand-400 shadow-xs" : "text-slate-500"
              }`}
            >
              مسندة إلي
            </button>
          )}
          <button
            onClick={() => setScope("my_created")}
            className={`px-3 py-1.5 rounded-xl transition ${
              scope === "my_created" ? "bg-white dark:bg-slate-900 text-brand-800 dark:text-brand-400 shadow-xs" : "text-slate-500"
            }`}
          >
            طلباتي
          </button>
          {isItOrAdmin && (
            <button
              onClick={() => setScope("unassigned")}
              className={`px-3 py-1.5 rounded-xl transition ${
                scope === "unassigned" ? "bg-white dark:bg-slate-900 text-brand-800 dark:text-brand-400 shadow-xs" : "text-slate-500"
              }`}
            >
              غير مسندة
            </button>
          )}
        </div>

        <button
          onClick={onOpenNewTicket}
          className="flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إنشاء تذكرة</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث برقم التذكرة، العنوان، اسم العميل..."
            className="w-full text-xs pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-brand-800"
          />
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <option value="all">كل الحالات</option>
          <option value="New">جديدة</option>
          <option value="InProgress">قيد المعالجة</option>
          <option value="WaitingEmployee">بانتظار الموظف</option>
          <option value="Resolved">تم الحل</option>
          <option value="Closed">مغلقة</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <option value="all">كل الأولويات</option>
          <option value="Urgent">حرجة</option>
          <option value="High">مرتفعة</option>
          <option value="Medium">متوسطة</option>
          <option value="Low">منخفضة</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <option value="all">كل التصنيفات</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
            <tr>
              <th className="py-3.5 px-4">رقم التذكرة</th>
              <th className="py-3.5 px-4">عنوان التذكرة</th>
              <th className="py-3.5 px-4">مقدم الطلب</th>
              <th className="py-3.5 px-4">التصنيف</th>
              <th className="py-3.5 px-4">الأولوية</th>
              <th className="py-3.5 px-4">المسند إليه</th>
              <th className="py-3.5 px-4">الحالة</th>
              <th className="py-3.5 px-4">مؤشر SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  جاري تحميل التذاكر...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  لا توجد تذاكر مطابقة لمعايير البحث
                </td>
              </tr>
            ) : (
              tickets.map((t: any) => {
                const sla = calculateSlaStatus(t, slaHours);
                const sConf = statusMap[t.status] || { label: t.status, bg: "bg-slate-100", text: "text-slate-600" };
                const pConf = priorityMap[t.priority] || { label: t.priority, badge: "bg-slate-100 text-slate-600" };

                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      #{t.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{t.title}</span>
                        {t._count?.comments > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 font-normal">
                            <MessageSquare className="w-3 h-3" />
                            {t._count.comments}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {t.requester.titlePrefix} {t.requester.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400">{t.requester.department?.name || "-"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{t.category.name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${pConf.badge}`}>
                        {pConf.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {t.assignedTo ? `${t.assignedTo.titlePrefix || ""} ${t.assignedTo.fullName}` : <span className="text-slate-400 italic">غير مسندة</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${sConf.bg} ${sConf.text}`}>
                        {sConf.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {["Resolved", "Closed"].includes(t.status) ? (
                        <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>منجزة</span>
                        </span>
                      ) : sla.isOverdue ? (
                        <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                          <span>متأخرة!</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>متبقي {sla.remainingHours} س</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
