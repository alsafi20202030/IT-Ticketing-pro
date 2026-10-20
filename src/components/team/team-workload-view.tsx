"use client";

import React from "react";
import { Headphones, CheckCircle, Clock, ShieldCheck, UserMinus, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function TeamWorkloadView() {
  const { data: bootData, isLoading } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: async () => {
      const res = await fetch("/api/bootstrap");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-slate-400">جاري تحميل بيانات الفريق...</div>;
  }

  const staff = bootData?.staff || [];
  const staffLoad = bootData?.staffLoad || [];

  const getLoadCount = (id: number) => {
    const item = staffLoad.find((l: any) => l.assigneeId === id);
    return item ? item.count : 0;
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Headphones className="w-5 h-5 text-brand-800 dark:text-brand-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">أعضاء فريق تقنية المعلومات وأعباء العمل</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          متابعة تذاكر الدعم الفني المفتوحة لكل أخصائي وتوزيع المهام التلقائي وفق قواعد الأقسام.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {staff.map((member: any) => {
            const count = getLoadCount(member.id);
            return (
              <div
                key={member.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-brand-800 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {member.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">{member.displayName}</h4>
                      <span className="text-[11px] text-slate-400">أخصائي دعم فني</span>
                    </div>
                  </div>
                  {member.isOnLeave ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                      في إجازة
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      متاح
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500">التذاكر النشطة المفتوحة:</span>
                  <span className="font-extrabold text-sm text-brand-800 dark:text-brand-400">
                    {count} تذكرة
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
