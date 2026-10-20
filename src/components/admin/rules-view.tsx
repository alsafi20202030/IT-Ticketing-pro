"use client";

import React from "react";
import { GitFork, Check, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function RulesView() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin_rules"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rules");
      return res.json();
    },
  });

  const ruleMutation = useMutation({
    mutationFn: async ({ departmentId, assigneeId }: { departmentId: number; assigneeId: number }) => {
      const res = await fetch("/api/admin/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId, assigneeId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_rules"] });
      queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
    },
  });

  const rules = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-800 dark:text-white">قواعد الإسناد التلقائي للتذاكر</h2>
        <p className="text-xs text-slate-500">
          تحديد الموظف الافتراضي المسؤول عن تذاكر كل قسم عند إنشائها تلقائياً.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
            <tr>
              <th className="py-3.5 px-4">القسم</th>
              <th className="py-3.5 px-4">موظف الدعم الافتراضي المسند إليه</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={2} className="text-center py-8 text-slate-400">
                  جاري تحميل القواعد...
                </td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center py-8 text-slate-400">
                  لا توجد أقسام معرفة
                </td>
              </tr>
            ) : (
              rules.map((r: any) => (
                <tr key={r.departmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-white">{r.department}</td>
                  <td className="py-3.5 px-4">
                    <select
                      value={r.assigneeId || ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          ruleMutation.mutate({
                            departmentId: r.departmentId,
                            assigneeId: parseInt(e.target.value, 10),
                          });
                        }
                      }}
                      className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 min-w-56"
                    >
                      <option value="">-- بدون إسناد افتراضي --</option>
                      {r.staff?.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
