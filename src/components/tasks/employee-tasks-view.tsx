"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Plus,
  User,
  Clock,
  Loader2,
} from "lucide-react";

interface StaffMember {
  id: number;
  fullName: string;
  displayName: string;
  isOnLeave?: boolean;
  role?: string;
}

interface EmployeeTask {
  id: number;
  userId: number;
  title: string;
  description?: string | null;
  taskType: string;
  status: string;
  workDate: string;
  completedAt?: string | null;
  createdAt: string;
  user: { id: number; fullName: string; role: string };
}

interface EmployeeTasksViewProps {
  currentUser: { id: number; fullName: string; role: string };
  staff: StaffMember[];
}

export function EmployeeTasksView({ currentUser, staff }: EmployeeTasksViewProps) {
  const isItOrAdmin = currentUser.role === "IT" || currentUser.role === "Admin";
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTaskType, setNewTaskType] = useState("Other");
  const [newAssigneeId, setNewAssigneeId] = useState<number | null>(null);
  const [newWorkDate, setNewWorkDate] = useState("");
  const [error, setError] = useState("");

  const taskTypeOptions = [
    { value: "Meeting", label: "اجتماع" },
    { value: "VendorFollowUp", label: "متابعة مورد" },
    { value: "RequestHandling", label: "معالجة طلب" },
    { value: "Maintenance", label: "صيانة" },
    { value: "Other", label: "أخرى" },
  ];

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    Pending: { label: "قيد الانتظار", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
    Completed: { label: "مكتملة", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  };

  useEffect(() => {
    setStaffOptions(isItOrAdmin ? staff : staff.filter((s) => s.id === currentUser.id));
  }, [staff, isItOrAdmin, currentUser.id]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("تعذر جلب المهام");
      const json = await res.json();
      setTasks(json.tasks || []);
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const createTask = async () => {
    if (!newTitle.trim()) return;
    setError("");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          taskType: newTaskType,
          userId: newAssigneeId || currentUser.id,
          workDate: newWorkDate || new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "تعذر إنشاء المهمة");
      }
      const json = await res.json();
      setTasks((prev) => [json.task, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setNewAssigneeId(isItOrAdmin ? null : currentUser.id);
      setNewWorkDate("");
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    }
  };

  const toggleTask = async (task: EmployeeTask) => {
    const nextStatus = task.status === "Completed" ? "Pending" : "Completed";
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: nextStatus }),
      });
      if (!res.ok) throw new Error("تعذر تحديث المهمة");
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: nextStatus,
                completedAt: nextStatus === "Completed" ? new Date().toISOString() : null,
              }
            : t
        )
      );
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">جاري تحميل المهام...</div>;
  }

  const pendingCount = tasks.filter((t) => t.status === "Pending").length;
  const completedCount = tasks.filter((t) => t.status === "Completed").length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white">مهام موظفي قسم IT</h2>
          <p className="text-xs text-slate-500">
            إدارة المهام اليومية للأعضاء (متابعة موردين، صيانة، اجتماعات، إلخ).
          </p>
        </div>
        {error && (
          <div className="p-2.5 text-xs bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-900">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-semibold text-slate-400 uppercase">إجمالي المهام</div>
          <div className="text-lg font-bold text-slate-800 dark:text-white">{tasks.length}</div>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-semibold text-amber-600 uppercase">قيد الانتظار</div>
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{pendingCount}</div>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-semibold text-emerald-600 uppercase">مكتملة</div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</div>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-semibold text-slate-600 uppercase">فريق العمل</div>
          <div className="text-lg font-bold text-slate-800 dark:text-white">{staffOptions.length}</div>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white mb-3">إضافة مهمة جديدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="col-span-1 md:col-span-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="عنوان المهمة (مثال: متابعة تحديث الخوادم)"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-800"
            />
          </div>
          {isItOrAdmin && (
            <select
              value={newAssigneeId || ""}
              onChange={(e) => setNewAssigneeId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-800"
            >
              <option value="">المسند إليه (الافتراضي أنت)</option>
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName} {s.isOnLeave ? " (في إجازة)" : ""}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={createTask}
            disabled={!newTitle.trim()}
            className="md:col-span-1 bg-brand-800 hover:bg-brand-900 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> إضافة
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="وصف المهمة (اختياري)"
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-800"
          />
          <select
            value={newTaskType}
            onChange={(e) => setNewTaskType(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-800"
          >
            {taskTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={newWorkDate}
            onChange={(e) => setNewWorkDate(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-800"
          />
        </div>
        {!isItOrAdmin && (
          <p className="mt-2 text-[10px] text-slate-400">تُضاف المهمة إليك كمسؤول عنها تلقائيًا.</p>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
          <Clock className="w-4 h-4" /> قائمة المهام
        </h3>
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">لا توجد مهام بعد</div>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => {
              const assignee = staff.find((s) => s.id === t.userId);
              const sConf = statusMap[t.status] || statusMap.Pending;
              const canToggle = isItOrAdmin || t.userId === currentUser.id;
              return (
                <div
                  key={t.id}
                  className={`p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 ${
                    t.status === "Completed" ? "bg-slate-50/50 dark:bg-slate-900/30" : ""
                  }`}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 border-slate-200 dark:border-slate-700">
                    {t.status === "Completed" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mr-2">{t.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${sConf.bg} ${sConf.color}`}
                      >
                        {sConf.label}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate md:max-w-[300px]">{t.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <User className="w-3 h-3" />
                      <span>{assignee?.fullName || "غير محدد"}</span>
                      <Clock className="w-3 h-3 ml-2" />
                      <span>{new Date(t.workDate).toLocaleDateString("ar-SA")}</span>
                    </div>
                  </div>
                  {canToggle && (
                    <button
                      onClick={() => toggleTask(t)}
                      className={`p-1.5 rounded-md text-xs font-medium transition ${
                        t.status === "Completed"
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                      }`}
                    >
                      {t.status === "Completed" ? "إعادة إلى الانتظار" : "تمييز مكتملة"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

