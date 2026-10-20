"use client";

import React, { useState } from "react";
import { Users, Plus, Check, X, Shield, Lock, Trash2, Edit, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface UsersViewProps {
  departments: Array<{ id: number; name: string }>;
}

export function UsersView({ departments }: UsersViewProps) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: "",
    titlePrefix: "أ.",
    email: "",
    role: "User",
    departmentId: departments[0]?.id ? String(departments[0].id) : "",
    password: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("فشل تحميل المستخدمين");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "فشل إضافة المستخدم");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
      setShowAddModal(false);
      setNewUser({
        fullName: "",
        titlePrefix: "أ.",
        email: "",
        role: "User",
        departmentId: departments[0]?.id ? String(departments[0].id) : "",
        password: "",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
    },
  });

  const users = data?.users || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white">إدارة حسابات المستخدمين</h2>
          <p className="text-xs text-slate-500">إدارة الصلاحيات، اعتماد طلبات التسجيل، وإسناد الأدوار.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
            <tr>
              <th className="py-3 px-4">المستخدم</th>
              <th className="py-3 px-4">البريد الإلكتروني</th>
              <th className="py-3 px-4">القسم</th>
              <th className="py-3 px-4">الدور</th>
              <th className="py-3 px-4">الحالة</th>
              <th className="py-3 px-4">إجراءات سريعة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  جاري تحميل المستخدمين...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  لا يوجد مستخدمين مسجلين
                </td>
              </tr>
            ) : (
              users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    {u.titlePrefix} {u.fullName}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{u.email}</td>
                  <td className="py-3.5 px-4">{u.department || "-"}</td>
                  <td className="py-3.5 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => updateMutation.mutate({ id: u.id, role: e.target.value })}
                      className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1"
                    >
                      <option value="User">مستخدم (User)</option>
                      <option value="IT">دعم فني (IT)</option>
                      <option value="Admin">مدير نظام (Admin)</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4">
                    {!u.isApproved ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                        بانتظار الموافقة
                      </span>
                    ) : u.isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        نشط
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                        معطل
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      {!u.isApproved && (
                        <button
                          onClick={() => updateMutation.mutate({ id: u.id, isApproved: true })}
                          title="اعتماد الحساب"
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium"
                        >
                          اعتماد
                        </button>
                      )}
                      <button
                        onClick={() => updateMutation.mutate({ id: u.id, isActive: !u.isActive })}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium ${
                          u.isActive
                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        }`}
                      >
                        {u.isActive ? "تعطيل" : "تنشيط"}
                      </button>
                      {u.role === "IT" && (
                        <button
                          onClick={() => updateMutation.mutate({ id: u.id, isOnLeave: !u.isOnLeave })}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium ${
                            u.isOnLeave ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.isOnLeave ? "إنهاء الإجازة" : "في إجازة"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">إضافة مستخدم جديد</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addMutation.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">الدور</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="User">مستخدم عادي</option>
                    <option value="IT">أخصائي دعم IT</option>
                    <option value="Admin">مدير نظام Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">القسم</label>
                  <select
                    value={newUser.departmentId}
                    onChange={(e) => setNewUser({ ...newUser, departmentId: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">كلمة المرور المؤقتة</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-500"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="px-4 py-2 bg-brand-800 text-white rounded-xl text-xs font-semibold"
                >
                  {addMutation.isPending ? "جاري الإضافة..." : "إضافة المستخدم"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
