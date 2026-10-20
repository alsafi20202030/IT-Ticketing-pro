"use client";

import React, { useState } from "react";
import { X, Send, AlertCircle, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Array<{ id: number; name: string }>;
  staff: Array<{ id: number; fullName: string; displayName: string; isOnLeave: boolean }>;
  requesters: Array<{ id: number; fullName: string; displayName: string; role: string }>;
  isItOrAdmin: boolean;
  allowAssigneeChoice: boolean;
}

export function NewTicketModal({
  isOpen,
  onClose,
  categories,
  staff,
  requesters,
  isItOrAdmin,
  allowAssigneeChoice,
}: NewTicketModalProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ? String(categories[0].id) : "");
  const [priority, setPriority] = useState("Medium");
  const [assignedToId, setAssignedToId] = useState("");
  const [requesterId, setRequesterId] = useState("");
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      setError("");
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          categoryId: parseInt(categoryId, 10),
          priority,
          assignedToId: assignedToId ? parseInt(assignedToId, 10) : undefined,
          requesterId: requesterId ? parseInt(requesterId, 10) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "حدث خطأ أثناء إنشاء التذكرة");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
      // Reset form
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setAssignedToId("");
      setRequesterId("");
      onClose();
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !categoryId) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-800 dark:text-white">إنشاء تذكرة دعم فني جديدة</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Requester (For IT/Admin only) */}
          {isItOrAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                مقدم الطلب (العميل)
              </label>
              <select
                value={requesterId}
                onChange={(e) => setRequesterId(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-800 text-slate-800 dark:text-slate-200"
              >
                <option value="">أنا مقدم الطلب (الحساب الحالي)</option>
                {requesters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              عنوان التذكرة <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: عطل في طابعة المحاسبة أو تعذر الاتصال بالشبكة"
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                التصنيف <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-800 text-slate-800 dark:text-slate-200"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                الأولوية
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-800 text-slate-800 dark:text-slate-200"
              >
                <option value="Low">منخفضة (Low)</option>
                <option value="Medium">متوسطة (Medium)</option>
                <option value="High">مرتفعة (High)</option>
                <option value="Urgent">حرجة / عاجلة (Urgent)</option>
              </select>
            </div>
          </div>

          {/* Assignee choice (if allowed or IT/Admin) */}
          {(isItOrAdmin || allowAssigneeChoice) && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                إسناد إلى موظف دعم محدد (اختياري)
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-800 text-slate-800 dark:text-slate-200"
              >
                <option value="">إسناد تلقائي حسب قواعد القسم</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName} {s.isOnLeave ? "(في إجازة)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              تفاصيل المشكلة والوصف <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب تفاصيل المشكلة بدقة لمساعدة فريق الدعم في معالجتها..."
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-brand-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-1.5 bg-brand-800 hover:bg-brand-900 disabled:opacity-50 text-white font-medium text-xs py-2 px-5 rounded-xl shadow-xs transition"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال التذكرة</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
