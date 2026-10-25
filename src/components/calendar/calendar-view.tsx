"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Moon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface CurrentUser {
  id: number;
  fullName: string;
  role: string;
}

interface StaffMember {
  id: number;
  fullName: string;
  displayName: string;
  titlePrefix: string;
  isOnLeave: boolean;
  role: string;
}

interface Shift {
  id: number;
  staffId: number;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "available" | "busy" | "leave" | "offline";
  role: string;
}

interface CalendarViewProps {
  currentUser: CurrentUser;
  staff: StaffMember[];
}

export function CalendarView({ currentUser, staff }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data, isLoading } = useQuery<{ shifts: Shift[] }>({
    queryKey: ["calendar_shifts", currentDate.toISOString().split("T")[0]],
    queryFn: async () => {
      const res = await fetch(
        `/api/calendar/shifts?date=${currentDate.toISOString().split("T")[0]}`
      );
      if (!res.ok) throw new Error("فشل جلب الجدولة");
      return res.json();
    },
    retry: false,
  });

  const shifts = data?.shifts || [];

  const monthNames = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getShiftsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return shifts.filter((s) => s.date === dateStr);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white">التقويم والجدولة</h2>
          <p className="text-xs text-slate-500">عرض جلسات العمل، الإجازات، والأدوار المتاحة للموظفين.</p>
        </div>
        <button
          onClick={goToToday}
          className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition"
        >
          <CalendarDays className="w-4 h-4" />
          <span>اليوم</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
          >
            العودة إلى اليوم
          </button>
        </div>

        {/* Calendar Grid Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"].map((day) => (
            <div key={day} className="text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="h-14 rounded-lg border border-slate-100 dark:border-slate-800" />
          ))}

          {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
            const dayShifts = getShiftsForDate(date);
            const isSelected = selectedDate ? (
              date.getDate() === selectedDate.getDate() &&
              date.getMonth() === selectedDate.getMonth() &&
              date.getFullYear() === selectedDate.getFullYear()
            ) : false;

            return (
              <button
                key={i + 1}
                onClick={() => setSelectedDate(date)}
                className={`h-14 rounded-xl border transition text-right ${isSelected
                  ? "border-brand-500 bg-brand-500/10 dark:border-brand-400 dark:bg-brand-400/5"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  } ${isToday(date) ? "ring-2 ring-brand-500 bg-brand-500/5" : ""}`}
              >
                <div className={`text-xs font-bold ${isSelected ? "text-brand-700 dark:text-brand-400" : "text-slate-700 dark:text-slate-300"}`}>
                  {date.getDate()}
                </div>
                {dayShifts.length > 0 && (
                  <div className="flex flex-col gap-0.5 mt-1">
                    {dayShifts.slice(0, 3).map((shift) => (
                      <div
                        key={shift.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${shift.status === "available"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : shift.status === "busy"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            : shift.status === "leave"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                              : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                      >
                        {shift.status}
                      </div>
                    ))}
                    {dayShifts.length > 3 && (
                      <div className="text-[10px] text-slate-400">+ {dayShifts.length - 3} more</div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">
            الأنشطة في {selectedDate.toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </h3>

          {selectedDate.getDate() === new Date().getDate() &&
          selectedDate.getMonth() === new Date().getMonth() &&
          selectedDate.getFullYear() === new Date().getFullYear() ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">اليوم</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-500">هذا هو اليوم الحالي</p>
              </div>
            </div>
          ) : null}

          {getShiftsForDate(selectedDate).length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <CalendarDays className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-xs">لا توجد جدولة لهذا اليوم</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getShiftsForDate(selectedDate).map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold ${shift.status === "available"
                      ? "bg-emerald-500"
                      : shift.status === "busy"
                        ? "bg-amber-500"
                        : shift.status === "leave"
                          ? "bg-rose-500"
                          : "bg-slate-500"
                      }`}>
                      {shift.staffName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-white">{shift.staffName}</p>
                      <p className="text-[11px] text-slate-500">{shift.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white">
                      {shift.startTime} - {shift.endTime}
                    </p>
                    <span className={`text-[10px] font-semibold uppercase ${shift.status === "available"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : shift.status === "busy"
                        ? "text-amber-600 dark:text-amber-400"
                        : shift.status === "leave"
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-slate-500"
                      }`}>
                      {shift.status === "available" ? "متاح" : shift.status === "busy" ? "مشغول" : shift.status === "leave" ? "إجازة" : "غير متصل"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Staff Schedule Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">ملخص جلسات العمل</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staff.map((member) => {
            const memberShifts = shifts.filter((s) => s.staffId === member.id);
            const onLeave = member.isOnLeave;
            const availableCount = memberShifts.filter((s) => s.status === "available").length;
            const busyCount = memberShifts.filter((s) => s.status === "busy").length;
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-bold">
                  {member.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{member.fullName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{member.role}</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Users className="w-3.5 h-3.5" />
                    {memberShifts.length}
                  </span>
                  <span className={`flex items-center gap-1 ${onLeave ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    <Moon className="w-3.5 h-3.5" />
                    {onLeave ? "نائف" : "متاح"}
                  </span>
                  <span className="text-slate-500">{availableCount} متاح</span>
                  <span className="text-slate-500">{busyCount} مشغول</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isLoading && !data && (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}
    </div>
  );
}
