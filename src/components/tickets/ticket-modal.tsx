"use client";

import React, { useState, useEffect } from "react";
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
  History,
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
  const isItOrAdmin = currentUser.role === "IT" || currentUser.role === "Admin";

  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");
  const [newMessage, setNewMessage] = useState("");
  const [isStaffOnly, setIsStaffOnly] = useState(false);

  const [edit, setEdit] = useState<{
    title: string;
    description: string;
    categoryId: string;
    status: string;
    priority: string;
    assignedToId: string;
  } | null>(null);

  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
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

  useEffect(() => {
    if (ticket && !edit) {
      setEdit({
        title: ticket.title,
        description: ticket.description || "",
        categoryId: String(ticket.categoryId),
        status: ticket.status,
        priority: ticket.priority,
        assignedToId: ticket.assignedToId ? String(ticket.assignedToId) : "",
      });
      setSaveError("");
      setSaveSuccess("");
    }
  }, [ticket, edit]);

  const messageMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, isStaffOnly }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "تعذر إرسال الرسالة");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket_messages", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      setNewMessage("");
      setIsStaffOnly(false);
    },
  });
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!ticketId) return;
      const payload: any = {};
      if (edit?.title !== undefined) payload.title = edit.title;
      if (edit?.description !== undefined) payload.description = edit.description;
      if (edit?.categoryId !== undefined)
        payload.categoryId = edit.categoryId ? parseInt(edit.categoryId, 10) : undefined;
      if (edit?.status !== undefined) payload.status = edit.status;
      if (edit?.priority !== undefined) payload.priority = edit.priority;
      if (edit?.assignedToId !== undefined)
        payload.assignedToId = edit.assignedToId ? parseInt(edit.assignedToId, 10) : null;

      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "فشل حفظ التغييرات");
      return json;
    },
    onSuccess: () => {
      setSaveSuccess("تم حفظ جميع التغييرات بنجاح في قاعدة البيانات.");
      setSaveError("");
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
      if (ticketId) {
        queryClient.invalidateQueries({ queryKey: ["ticket_messages", ticketId] });
      }
    },
    onError: (err: any) => {
      setSaveError(err.message || "حدث خطأ أثناء حفظ التغييرات. يرجى المحاولة مرة أخرى.");
      setSaveSuccess("");
    },
  });

  const canSend = Boolean(ticketId && currentUser);
  const hasChanges =
    edit &&
    ticket &&
    (edit.title !== ticket.title ||
      edit.description !== (ticket.description || "") ||
      edit.categoryId !== String(ticket.categoryId) ||
      edit.status !== ticket.status ||
      edit.priority !== ticket.priority ||
      edit.assignedToId !== (ticket.assignedToId ? String(ticket.assignedToId) : ""));

  const sla = ticket ? calculateSlaStatus(ticket, slaHours) : null;

  const statusMap: Record<string, { label: string; bg: string; text: string }> = {
    New: { label: "جديدة", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400" },
    InProgress: { label: "قيد المعالجة", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400" },
    WaitingEmployee: { label: "بانتظار الموظف", bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-400" },
    Resolved: { label: "تم الحل", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400" },
    Closed: { label: "مغلقة", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
  };

  const priorityMap: Record<string, { label: string; text: string }> = {
    Urgent: { label: "حرجة (Urgent)", text: "text-rose-600 font-bold" },
    High: { label: "مرتفعة (High)", text: "text-orange-600 font-semibold" },
    Medium: { label: "متوسطة (Medium)", text: "text-amber-600" },
    Low: { label: "منخفضة (Low)", text: "text-slate-500" },
  };

  const isEditableField =
    isItOrAdmin ||
    currentUser.canEditAnyTicket ||
    ticket?.requesterId === currentUser.id ||
    ticket?.assignedToId === currentUser.id;

  if (!ticketId) return null;

  const handleSave = () => {
    setSaveError("");
    setSaveSuccess("");
    saveMutation.mutate();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !canSend) return;
    messageMutation.mutate(newMessage.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              #{ticketId}
            </span>
            <h2 className="font-bold text-base text-slate-900 dark:text-white truncate max-w-md">
              {ticket?.title || "جاري التحميل..."}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex gap-1 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition ${
                activeTab === "chat"
                  ? "border-brand-800 dark:border-brand-400 text-brand-800 dark:text-brand-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              محادثة التذكرة
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition ${
                activeTab === "history"
                  ? "border-brand-800 dark:border-brand-400 text-brand-800 dark:text-brand-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              السجل والتعديلات
            </button>
          </div>
          {activeTab === "chat" ? (
            <>
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> تعديل بيانات التذكرة والإسناد
                  </h3>
                  {saveError ? (
                    <span className="text-[10px] font-bold text-rose-600">{saveError}</span>
                  ) : saveSuccess ? (
                    <span className="text-[10px] font-bold text-emerald-600">{saveSuccess}</span>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="col-span-2 sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">عنوان التذكرة</label>
                    <input
                      type="text"
                      value={edit?.title || ""}
                      onChange={(e) => setEdit({ ...edit!, title: e.target.value })}
                      disabled={!isEditableField}
                      className={`w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-800 text-slate-800 dark:text-slate-200 ${!isEditableField ? "bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed" : ""}`}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">وصف المشكلة</label>
                    <textarea
                      value={edit?.description || ""}
                      onChange={(e) => setEdit({ ...edit!, description: e.target.value })}
                      rows={3}
                      disabled={!isEditableField}
                      className={`w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-800 text-slate-800 dark:text-slate-200 ${!isEditableField ? "bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed" : ""}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">حالة التذكرة</label>
                    <select
                      value={edit?.status || ticket?.status || "New"}
                      onChange={(e) => setEdit({ ...edit!, status: e.target.value })}
                      disabled={!isItOrAdmin}
                      className={`w-full text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden ${statusMap[edit?.status || ticket?.status || "New"]?.bg} ${statusMap[edit?.status || ticket?.status || "New"]?.text} ${!isItOrAdmin ? "bg-slate-100/50 dark:bg-slate-800/50 cursor-not-allowed" : ""}`}
                    >
                      <option value="New">جديدة (New)</option>
                      <option value="InProgress">قيد المعالجة (In Progress)</option>
                      <option value="WaitingEmployee">بانتظار الموظف (Waiting Employee)</option>
                      <option value="Resolved">تم الحل (Resolved)</option>
                      <option value="Closed">مغلقة (Closed)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">الأولوية</label>
                    <select
                      value={edit?.priority || ticket?.priority || "Medium"}
                      onChange={(e) => setEdit({ ...edit!, priority: e.target.value })}
                      disabled={!isItOrAdmin}
                      className="w-full text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                    >
                      <option value="Low">منخفضة (Low)</option>
                      <option value="Medium">متوسطة (Medium)</option>
                      <option value="High">مرتفعة (High)</option>
                      <option value="Urgent">حرجة (Urgent)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">الفئة</label>
                    <select
                      value={edit?.categoryId || String(ticket?.categoryId || "")}
                      onChange={(e) => setEdit({ ...edit!, categoryId: e.target.value })}
                      disabled={!isEditableField}
                      className="w-full text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                    >
                      <option value="">اختر الفئة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">المسند إليه</label>
                    <select
                      value={edit?.assignedToId || ""}
                      onChange={(e) => setEdit({ ...edit!, assignedToId: e.target.value })}
                      disabled={!isItOrAdmin && !currentUser.canReassignTickets}
                      className="w-full text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                    >
                      <option value="">غير مسندة (Unassigned)</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.displayName} {s.isOnLeave ? " (في إجازة)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={
                      !hasChanges ||
                      saveMutation.isPending ||
                      (!isItOrAdmin && !currentUser.canEditAnyTicket && !currentUser.canReassignTickets)
                    }
                    className={`w-fit px-6 py-2.5 text-xs font-bold rounded-xl shadow-lg transition ${
                      saveMutation.isPending
                        ? "opacity-70 cursor-not-allowed"
                        : !hasChanges
                          ? "bg-slate-300 dark:bg-slate-700 text-slate-500"
                          : "bg-brand-800 hover:bg-brand-900 text-white"
                    }`}
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> حفظ التغييرات
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 italic">
                  جميع التعديلات محفوظة بشكل مؤقت ولن تُعتمد حتى ضغط زر "حفظ التغييرات". إذا غادرت الصفحة دون الحفظ، تُلغى التغييرات.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-indigo-500" /> المحادثة
                  </h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    ticket?.status === "Resolved" || ticket?.status === "Closed"
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-500"
                      : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                  }`}>
                    {ticket?.status === "Resolved" || ticket?.status === "Closed" ? "مغلقة أمام الرسائل" : "مفتوحة"}
                  </span>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {(ticket?.messages || []).length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">لا توجد رسائل بعد</div>
                  ) : (
                    (ticket?.messages || []).map((m: any) => {
                      const isOwn = m.userId === currentUser.id;
                      const isStaffOnlyMsg = m.isStaffOnly;
                      const canViewStaffOnly = isItOrAdmin;
                      if (isStaffOnlyMsg && !canViewStaffOnly) return null;
                      return (
                        <div
                          key={m.id}
                          className={`p-3 rounded-2xl text-xs max-w-md ${
                            isOwn
                              ? "bg-brand-800 text-white border border-brand-700 ml-auto"
                              : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 mr-4"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold uppercase ${isOwn ? "text-brand-200" : "text-slate-500 dark:text-slate-400"}`}>
                              {m.senderName || m.user?.fullName || "مستخدم"}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {new Date(m.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          {isStaffOnlyMsg && (
                            <span className="inline-block text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 px-2 py-0.5 rounded mb-2 block font-bold border border-rose-200 dark:border-rose-800">
                              داخلي - موظفي تقنية المعلومات فقط
                            </span>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    {isItOrAdmin ? (
                      <label className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isStaffOnly}
                          onChange={(e) => setIsStaffOnly(e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-700"
                        />
                        <Lock className="w-3 h-3" />
                        <span>رسالة خاصة لموظفي تقنية المعلومات فقط</span>
                      </label>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Send className="w-3 h-3 text-slate-400" />
                        <span>رسالة عامة مرئية لموظفي الدعم وصاحب التذكرة</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className={isStaffOnly ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                      {isStaffOnly ? "النطاق: موظفو تقنية المعلومات فقط" : "النطاق: فريق الدعم وصاحب التذكرة"}
                    </span>
                  </div>
                  <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={isStaffOnly ? "اكتب رسالتك الداخلية للموظفين فقط..." : "اكتب رسالتك في المحادثة..."}
                      disabled={!canSend || !currentUser || ticket?.status === "Resolved" || ticket?.status === "Closed"}
                      className={`flex-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-800 text-slate-800 dark:text-slate-200 ${
                        !canSend || ticket?.status === "Resolved" || ticket?.status === "Closed"
                          ? "opacity-60 cursor-not-allowed"
                          : ""
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || messageMutation.isPending || !canSend || ticket?.status === "Resolved" || ticket?.status === "Closed"}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      {messageMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>إرسال</span>
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {ticket?.history?.map((h: any) => (
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
              {ticket?.history?.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">لا توجد سجلات تعديل بعد</div>
              )}
            </div>
          )}
        </div>

        {ticket && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0">
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
                <strong className="text-slate-700 dark:text-slate-200">{ticket.requester.department.name}</strong>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>التاريخ:</span>
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
            {sla && !["Resolved", "Closed"].includes(ticket.status) && (
              <span className={`text-[11px] font-bold ${sla.isOverdue ? "text-rose-600" : "text-slate-500"} flex items-center gap-1`}>
                {sla.isOverdue ? (
                  <>
                    <AlertTriangle className="w-3 h-3 animate-bounce" /> متأخرة!
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-slate-400" /> متبقي {sla.remainingHours} س
                  </>
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketModal;