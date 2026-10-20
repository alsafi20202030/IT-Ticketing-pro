"use client";

import React, { useState } from "react";
import { Building2, Plus, Trash2, Edit2, Check, X, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function DepartmentsView() {
  const queryClient = useQueryClient();
  const [newDeptName, setNewDeptName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin_departments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/departments");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      setError("");
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDeptName }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "فشل إضافة القسم");
      return d;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_departments"] });
      queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
      setNewDeptName("");
    },
    onError: (err: any) => setError(err.message),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await fetch("/api/admin/departments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_departments"] });
      queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      setError("");
      const res = await fetch(`/api/admin/departments?id=${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "تعذر حذف القسم");
      return d;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_departments"] });
      queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
    },
    onError: (err: any) => setError(err.message),
  });

  const departments = data?.departments || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-800 dark:text-white">إدارة الأقسام</h2>
        <p className="text-xs text-slate-500">تهيئة الأقسام وربط المستخدمين وقواعد الإسناد التلقائي بها.</p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Department Input */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex gap-2">
        <input
          type="text"
          value={newDeptName}
          onChange={(e) => setNewDeptName(e.target.value)}
          placeholder="أدخل اسم القسم الجديد (مثال: الشؤون القانونية)..."
          className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
        />
        <button
          onClick={() => addMutation.mutate()}
          disabled={!newDeptName.trim() || addMutation.isPending}
          className="px-4 py-2 bg-brand-800 text-white rounded-xl text-xs font-semibold hover:bg-brand-900 disabled:opacity-50 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة القسم</span>
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {departments.map((dept: any) => (
          <div
            key={dept.id}
            className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
          >
            {editingId === dept.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="text-xs p-1.5 border rounded-lg flex-1"
                />
                <button
                  onClick={() => renameMutation.mutate({ id: dept.id, name: editingName })}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">{dept.name}</h4>
                    <span className="text-[11px] text-slate-400">{dept.usersCount} مستخدم مسجل</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingId(dept.id);
                      setEditingName(dept.name);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(dept.id)}
                    className="p-2 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
