"use client";

import React, { useState } from "react";
import {
  X,
  Clock,
  User,
  Building2,
  Calendar,
  Send,
  AlertTriangle,
  CheckCircle2,
  Lock,
  MessageSquare,
  History,
  Star,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { calculateSlaStatus } from "@/lib/sla";

interface TicketModalProps {
  ticketId: number | null;
  onClose: () => void;
  currentUser: {
    id: number;
    fullName: string;
    role: string;
    canEditAnyTicket: boolean;
    canReassignTickets: boolean;
  };
  staff: Array<{ id: number; fullName: string; displayName: string; isOnLeave: boolean }>;
  slaHours: { urgent: number; high: number; medium: number; low: number };
  onOpenRateModal: (id: number) => void;
}

export function TicketModal({
  ticketId,
  onClose,
  currentUser,
  staff,
  slaHours,
  onOpenRateModal,
}: TicketModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"comments" | "history">("comments");
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [showHoldReasonPrompt, setShowHoldReasonPrompt] = useState(false);
  const [delayReason, setDelayReason] = useState("");

  const isItOrAdmin = currentUser.role === "IT" || currentUser.role === "Admin";

  const { data, isLoading } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (!res.ok) throw new Error("تعذر جلب تفاصيل التذكرة");
      return res.json();
    },
    enabled: !!ticketId,
  });

  const ticket = data?.ticket;

  // Mutation for updating status, priority, or assignee
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "حدث خطأ أثناء التحديث");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowHoldReasonPrompt(false);
      setDelayReason("");
    },
  });

  // Mutation for posting comments
  const commentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newComment,
          isInternal,
        }),
      });
      if (!res.ok) throw new Error("تعذر إرسال التعليق");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      setNewComment("");
      setIsInternal(false);
    },
  });

  if (!ticketId) return null;

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "OnHold") {
      setShowHoldReasonPrompt(true);
    } else {
      updateMutation.mutate({ status: newStatus });
    }
  };

  const submitHoldWithReason = () => {
    if (!delayReason.trim()) return;
    updateMutation.mutate({ status: "OnHold", delayReason });
  };

  const sla = ticket ? calculateSlaStatus(ticket, slaHours) : null;

  const statusMap: Record<string, { label: string; bg: string; text: string }> = {
    New: { label: "جديدة", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400" },
    InProgress: { label: "قيد المعالجة", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400" },
    OnHold: { label: "معلقة", bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-400" },
    Resolved: { label: "تم الحل", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400" },
    Closed: { label: "مغلقة", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
  };

  const priorityMap: Record<string, { label: string; text: string }> = {
    Urgent: { label: "حرجة (Urgent)", text: "text-rose-600 font-bold" },
    High: { label: "مرتفعة (High)", text: "text-orange-600 font-semibold" },
    Medium: { label: "متوسطة (Medium)", text: "text-amber-600" },
    Low: { label: "منخفضة (Low)", text: "text-slate-500" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              #{ticketId}
            </span>
            <h2 className="font-bold text-base text-slate-900 dark:text-white truncate max-w-md">
              {ticket?.title || "تحميل بيانات التذكرة..."}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading || !ticket ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-800" />
            <span className="text-xs">جاري تحميل بيانات التذكرة...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Stats Banner: SLA & Status Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SLA Clock Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>مؤشر اتفاقية SLA</span>
                  </span>
                  {sla?.isOverdue ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                      متأخرة!
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      ضمن الوقت
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>المستغرق: {sla?.effectiveElapsedHours} س</span>
                    <span>الهدف: {sla?.targetHours} س</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${sla?.isOverdue ? "bg-rose-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(100, sla?.progressPercent || 0)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status Changer */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  حالة التذكرة
                </span>
                <select
                  value={ticket.status}
                  disabled={!isItOrAdmin && !currentUser.canEditAnyTicket}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`w-full text-xs font-semibold rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-hidden ${
                    statusMap[ticket.status]?.bg || ""
                  } ${statusMap[ticket.status]?.text || ""}`}
                >
                  <option value="New">جديدة (New)</option>
                  <option value="InProgress">قيد المعالجة (In Progress)</option>
                  <option value="OnHold">معلقة (On Hold)</option>
                  <option value="Resolved">تم الحل (Resolved)</option>
                  <option value="Closed">مغلقة (Closed)</option>
                </select>
              </div>

              {/* Assignee Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  المسند إليه
                </span>
                {isItOrAdmin || currentUser.canReassignTickets ? (
                  <select
                    value={ticket.assignedToId || ""}
                    onChange={(e) => updateMutation.mutate({ assignedToId: e.target.value ? parseInt(e.target.value, 10) : null })}
                    className="w-full text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  >
                    <option value="">غير مسندة (Unassigned)</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName} {s.isOnLeave ? "(في إجازة)" : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {ticket.assignedTo?.fullName || "غير مسندة بعد"}
                  </span>
                )}
              </div>
            </div>

            {/* Prompt for Hold Reason */}
            {showHoldReasonPrompt && (
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-3 animate-in fade-in">
                <span className="block text-xs font-bold text-purple-900 dark:text-purple-300">
                  سبب تعليق التذكرة (إلزامي لتوثيق فترة التوقف):
                </span>
                <input
                  type="text"
                  required
                  placeholder="مثال: بانتظار وصول قطعة الغيار، بانتظار رد العميل..."
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-900"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowHoldReasonPrompt(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={submitHoldWithReason}
                    disabled={!delayReason.trim()}
                    className="px-3 py-1.5 text-xs bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-medium"
                  >
                    تأكيد تعليق التذكرة
                  </button>
                </div>
              </div>
            )}

            {/* Ticket Metadata Bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>مقدم الطلب:</span>
                <strong className="text-slate-700 dark:text-slate-200">
                  {ticket.requester.titlePrefix} {ticket.requester.fullName}
                </strong>
              </div>

              {ticket.requester.department && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>القسم:</span>
                  <strong className="text-slate-700 dark:text-slate-200">
                    {ticket.requester.department.name}
                  </strong>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>تاريخ الإنشاء:</span>
                <span>
                  {new Date(ticket.createdAt).toLocaleDateString("ar-SA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mr-auto">
                <span>الأولوية:</span>
                <span className={priorityMap[ticket.priority]?.text || ""}>
                  {priorityMap[ticket.priority]?.label || ticket.priority}
                </span>
              </div>
            </div>

            {/* Ticket Description */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">وصف المشكلة</h3>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </div>
            </div>

            {/* Rating Section (If resolved and requester) */}
            {(ticket.status === "Resolved" || ticket.status === "Closed") && (
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>تقييم جودة الخدمة</span>
                  </div>
                  {ticket.rating ? (
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      حصلت هذه التذكرة على تقييم: <strong className="text-amber-600 font-bold">{ticket.rating} من 5 نجوم</strong>
                      {ticket.ratingComment && ` - "${ticket.ratingComment}"`}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">لم يتم تقييم التذكرة بعد</span>
                  )}
                </div>
                {!ticket.rating && ticket.requesterId === currentUser.id && (
                  <button
                    onClick={() => onOpenRateModal(ticket.id)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition"
                  >
                    تقييم الآن
                  </button>
                )}
              </div>
            )}

            {/* Tabs: Comments & Timeline */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center gap-4 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                <button
                  onClick={() => setActiveTab("comments")}
                  className={`text-xs font-bold pb-2 border-b-2 flex items-center gap-1.5 transition ${
                    activeTab === "comments"
                      ? "border-brand-800 text-brand-800 dark:text-brand-400"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>الردود والمحادثة ({ticket.comments?.length || 0})</span>
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`text-xs font-bold pb-2 border-b-2 flex items-center gap-1.5 transition ${
                    activeTab === "history"
                      ? "border-brand-800 text-brand-800 dark:text-brand-400"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>سجل الإجراءات ({ticket.history?.length || 0})</span>
                </button>
              </div>

              {/* Comments Tab */}
              {activeTab === "comments" ? (
                <div className="space-y-4">
                  {/* Messages list */}
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {ticket.comments?.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">لا توجد ردود بعد</div>
                    ) : (
                      ticket.comments.map((c: any) => (
                        <div
                          key={c.id}
                          className={`p-3.5 rounded-2xl text-xs space-y-1.5 border ${
                            c.isInternal
                              ? "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-300"
                              : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              {c.user.fullName}
                              {c.isInternal && (
                                <span className="bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                                  ملاحظة داخلية
                                </span>
                              )}
                            </span>
                            <span>
                              {new Date(c.createdAt).toLocaleDateString("ar-SA", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{c.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Input */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">إضافة رد:</span>
                      {isItOrAdmin && (
                        <label className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                            className="rounded-sm border-purple-400 text-purple-700 focus:ring-purple-600"
                          />
                          <Lock className="w-3.5 h-3.5" />
                          <span>ملاحظة داخلية (لفريق IT فقط)</span>
                        </label>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="اكتب ردك هنا..."
                        className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-800"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newComment.trim() && !commentMutation.isPending) {
                            commentMutation.mutate();
                          }
                        }}
                      />
                      <button
                        onClick={() => commentMutation.mutate()}
                        disabled={!newComment.trim() || commentMutation.isPending}
                        className="bg-brand-800 hover:bg-brand-900 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
                      >
                        {commentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>إرسال</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* History Timeline */
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {ticket.history?.map((h: any) => (
                    <div key={h.id} className="flex items-start gap-2.5 text-xs">
                      <div className="w-2 h-2 rounded-full bg-brand-800 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{h.action}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          بواسطة: {h.byUser?.fullName || "النظام"} •{" "}
                          {new Date(h.at).toLocaleDateString("ar-SA", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
