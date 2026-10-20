"use client";

import React from "react";
import { History, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function ActivityView() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin_activity"],
    queryFn: async () => {
      const res = await fetch("/api/admin/activity");
      return res.json();
    },
  });

  const logs = data?.logs || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-800 dark:text-white">سجل العمليات والتدقيق (Audit Log)</h2>
        <p className="text-xs text-slate-500">سجل موثق لجميع أنشطة النظام وعمليات الدخول والتعديلات الحساسة.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
            <tr>
              <th className="py-3 px-4">الوقت والتاريخ</th>
              <th className="py-3 px-4">المستخدم</th>
              <th className="py-3 px-4">العملية المنفذة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-slate-400">
                  جاري تحميل السجلات...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-slate-400">
                  لا توجد عمليات مسجلة
                </td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {new Date(log.at).toLocaleDateString("ar-SA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-white">
                    {log.userName || "النظام"}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{log.action}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
