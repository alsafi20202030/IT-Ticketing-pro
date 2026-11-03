"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Shield, MessageCircle, Loader2, Send } from "lucide-react";

interface ChatViewProps {
  currentUser?: {
    id: number;
    fullName: string;
    role: string;
  };
}

interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: string;
  isRead: boolean;
  isStaffOnly: boolean;
  sender: {
    id: number;
    fullName: string;
    role: string;
  };
}

interface Conversation {
  id: number;
  title: string;
  ticketId: number | null;
  createdAt: string;
  updatedAt: string;
  participants: Array<{
    id: number;
    userId: number;
    user: { id: number; fullName: string; role: string };
    joinedAt: string;
    lastReadAt: string | null;
  }>;
  _count: { messages: number };
}

const ROLE_LABELS: Record<string, string> = {
  Admin: "مدير النظام",
  IT: "الدعم الفني",
  User: "مستخدم",
};

export function ChatView({ currentUser }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [staffOnly, setStaffOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const isItOrAdmin = currentUser?.role === "IT" || currentUser?.role === "Admin";

  const fetchConversation = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await fetch("/api/chat/conversations?ticketId=null");
      if (!res.ok) throw new Error("تعذر جلب المحادثات");
      const data = await res.json();
      const conversations: Conversation[] = data.conversations || [];

      let targetConversation = conversations.find((c) => !c.ticketId);

      if (!targetConversation) {
        const createRes = await fetch("/api/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "المحادثة العامة",
            ticketId: null,
            participantIds: [],
          }),
        });
        if (!createRes.ok) throw new Error("تعذر إنشاء المحادثة");
        targetConversation = (await createRes.json()) as Conversation;
      }

      if (targetConversation) {
        setConversation(targetConversation);
        await fetchMessages(targetConversation.id);
      }
    } catch (e: any) {
      setError(e.message || "حدث خطأ أثناء جلب المحادثة");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchMessages = async (conversationId: number) => {
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error("تعذر جلب الرسائل");
      const data = await res.json();
      const msgs: ChatMessage[] = data.messages || [];

      const filtered = msgs.filter((m) => {
        if (!m.isStaffOnly) return true;
        return isItOrAdmin;
      });

      setMessages(filtered);
    } catch (e: any) {
      setError(e.message || "حدث خطأ أثناء جلب الرسائل");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversation) return;
    if (!currentUser) return;

    setSending(true);
    setError("");
    try {
      const res = await fetch(
        `/api/chat/conversations/${conversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: input.trim(),
            isStaffOnly: staffOnly,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "تعذر إرسال الرسالة");
      }
      const newMsg = await res.json();
      setMessages((prev) => [...prev, newMsg.message]);
      setInput("");
    } catch (e: any) {
      setError(e.message || "حدث خطأ أثناء إرسال الرسالة");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto flex flex-col items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-brand-800 mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400">جاري تحميل المحادثة...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-800 shadow-sm max-w-4xl mx-auto">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg">
          <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto flex flex-col items-center justify-center h-96">
        <p className="text-xs text-slate-500 dark:text-slate-400">تعذر تهيئة المحادثة</p>
      </div>
    );
  }

  const canSend = currentUser && conversation.participants.some((p) => p.userId === currentUser.id);

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-brand-800 dark:text-brand-400" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">المحادثة والدعم الفني</h2>
        </div>
        {currentUser && (
          <span className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-3 py-1 rounded-full font-medium">
            {currentUser.fullName} • {ROLE_LABELS[currentUser.role] || currentUser.role}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={staffOnly}
            onChange={(e) => setStaffOnly(e.target.checked)}
            className="rounded-sm border-slate-300 text-brand-800 focus:ring-brand-500"
          />
          <span className={`font-semibold ${staffOnly ? "text-rose-700 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"}`}>
            {staffOnly ? "إرسال للموظفين فقط (فريق تقنية المعلومات)" : "إرسال للجميع"}
          </span>
        </label>
        {staffOnly && (
          <span className="flex items-center gap-1 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 px-2 py-1 rounded-full border border-rose-100 dark:border-rose-800">
            <Shield className="w-3 h-3" />
للموظفين فقط
          </span>
        )}
      </div>

      <div className="h-96 overflow-y-auto border border-slate-100 dark:border-slate-800 p-4 mb-4 rounded-lg bg-slate-50 dark:bg-slate-950/50 space-y-3">
        {messages.length === 0 ? (
          <p className="text-slate-400 text-center mt-32 text-sm">لا توجد رسائل حالياً. ابدأ المحادثة الآن.</p>
        ) : (
          messages.map((msg) => {
            const isOwn = currentUser && msg.senderId === currentUser.id;
            const isStaffOnlyMsg = msg.isStaffOnly;
            const canViewStaffOnly = isItOrAdmin;

            if (isStaffOnlyMsg && !canViewStaffOnly) return null;

            return (
              <div
                key={msg.id}
                className={`p-3 rounded-lg shadow-sm text-sm max-w-md ${
                  isOwn
                    ? "bg-brand-800 text-white border border-brand-700 ml-auto"
                    : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase ${isOwn ? "text-brand-200" : "text-slate-500 dark:text-slate-400"}`}>
                    {msg.sender.fullName}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {new Date(msg.createdAt).toLocaleTimeString("ar-SA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {isStaffOnlyMsg && (
                  <span className="inline-block text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 px-2 py-0.5 rounded mb-2 block font-bold border border-rose-200 dark:border-rose-800">
                    داخلي - للموظفين فقط
                  </span>
                )}
                <p className="whitespace-pre-wrap">{msg.body}</p>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={staffOnly ? "اكتب رسالتك الداخلية للموظفين فقط..." : "اكتب رسالتك..."}
          disabled={!canSend || !currentUser}
          className={`flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800020] ${
            !canSend ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />
        <button
          type="submit"
          disabled={!canSend || !input.trim() || sending}
          className={`bg-[#800020] hover:bg-[#600018] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition shadow flex items-center gap-2`}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>إرسال</span>
            </>
          )}
        </button>
      </form>

      {!canSend && currentUser && (
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            لا يمكنك الإرسال في هذه المحادثة. تأكد من أنك مشارك فيها.
          </p>
        </div>
      )}
    </div>
  );
}

export default ChatView;
