"use client";

import React, { useState } from "react";
import { X, KeyRound, AlertCircle, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  mustChange: boolean;
}

export function ChangePasswordModal({ isOpen, onClose, mustChange }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      setError("");
      setSuccess("");
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "حدث خطأ أثناء تغيير كلمة المرور");
      return data;
    },
    onSuccess: () => {
      setSuccess("تم تغيير كلمة المرور بنجاح!");
      setTimeout(() => {
        onClose();
      }, 1500);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-brand-800 dark:text-brand-400" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">تغيير كلمة المرور</h3>
          </div>
          {!mustChange && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {mustChange && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl text-xs">
            يجب تغيير كلمة المرور المؤقتة قبل المتابعة.
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-medium">
            {success}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-3"
        >
          {!mustChange && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                كلمة المرور الحالية
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              تأكيد كلمة المرور الجديدة
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            {!mustChange && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                إلغاء
              </button>
            )}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 bg-brand-800 text-white rounded-xl text-xs font-medium hover:bg-brand-900 disabled:opacity-50"
            >
              {mutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
