"use client";

import React, { useState, useRef } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  MessageCircle,
  Users,
  Send,
  Search,
  Loader2,
  Plus,
  Ticket,
  Mail,
} from "lucide-react";

interface ChatParticipant {
  id: number;
  fullName: string;
  role: string;
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
    user: ChatParticipant;
    joinedAt: string;
    lastReadAt: string | null;
  }>;
  ticket: {
    id: number;
    title: string;
    status: string;
    assignedToId: number | null;
  } | null;
  _count: { messages: number };
}

interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: string;
  isRead: boolean;
  sender: {
    id: number;
    fullName: string;
    role: string;
    staffRole: { id: number; name: string; color: string } | null;
  };
}

interface CurrentUser {
  id: number;
  fullName: string;
  role: string;
}

export function ChatView({ currentUser }: { currentUser: CurrentUser }) {
  const queryClient = useQueryClient();
  const isAdmin = currentUser.role === "Admin";
  const isIt = currentUser.role === "IT";

  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(
    null
  );
  const [newConversationTitle, setNewConversationTitle] = useState("");
  const [newParticipantIds, setNewParticipantIds] = useState<number[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [inputText, setInputText] = useState("");
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    refetch: refetchConversations,
  } = useQuery<{ conversations: Conversation[] }>({
    queryKey: ["chat_conversations"],
    queryFn: async () => {
      const res = await fetch("/api/chat/conversations");
      if (!res.ok) throw new Error("فشل جلب المحادثات");
      return res.json();
    },
  });

  const conversations = conversationsData?.conversations || [];

  const {
    data: messagesData,
    isLoading: messagesLoading,
  } = useQuery<{ messages: ChatMessage[]; conversation: Conversation }>({
    queryKey: ["chat_messages", selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return { messages: [], conversation: null };
      const res = await fetch(
        `/api/chat/conversations/${selectedConversationId}/messages`
      );
      if (!res.ok) throw new Error("فشل جلب الرسائل");
      return res.json();
    },
    enabled: !!selectedConversationId,
  });

  const messages = messagesData?.messages || [];
  const activeConversation = messagesData?.conversation || null;

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedConversationId) throw new Error("لم يتم اختيار محادثة");
      const res = await fetch(
        `/api/chat/conversations/${selectedConversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }
      );
      if (!res.ok) throw new Error("فشل إرسال الرسالة");
      return res.json();
    },
    onSuccess: () => {
      setInputText("");
      queryClient.invalidateQueries({
        queryKey: ["chat_messages", selectedConversationId],
      });
      refetchConversations();
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newConversationTitle.trim() || "محادثة جديدة",
          participantIds: newParticipantIds,
        }),
      });
      if (!res.ok) throw new Error("فشل إنشاء المحادثة");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat_conversations"] });
      setOpenCreate(false);
      setNewConversationTitle("");
      setNewParticipantIds([]);
    },
  });

  const handleSelectConversation = (id: number) => {
    setSelectedConversationId(id);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConversationId) return;
    sendMessageMutation.mutate(inputText.trim());
  };

  const scrollToBottom = () => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConversationId]);

  const statusLabel: Record<string, string> = {
    New: "جديدة",
    InProgress: "جاري العمل",
    WaitingEmployee: "في انتظار موظف",
    Resolved: "منتهية",
    Closed: "مغلقة",
  };
  return (
    <div className="flex h-full flex-col lg:flex-row overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* قائمة المحادثات (يسار) */}
      <div className="flex-1 min-w-0 flex flex-col border-r border-slate-200 dark:border-slate-800 lg:max-w-md lg:w-[420px]">
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-brand-800" />
            المحادثات
          </h2>
          <button
            onClick={() => setOpenCreate(true)}
            className="p-1.5 text-slate-400 hover:text-brand-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="محادثة جديدة"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="p-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="البحث في المحادثات..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-800 outline-none transition"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversationsLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
              جاري تحميل المحادثات...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              لا توجد محادثات بعد
            </div>
          ) : (
            conversations.map((c) => {
              const otherParticipants = c.participants.filter(
                (p) => p.userId !== currentUser.id
              );
              const canView =
                isAdmin ||
                !c.ticketId ||
                c.ticket?.assignedToId === currentUser.id ||
                c.ticket?.requesterId === currentUser.id;
              const isActive = selectedConversationId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectConversation(c.id)}
                  disabled={!canView}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-sm transition ${
                    isActive
                      ? "bg-brand-50 dark:bg-brand-950/40 text-brand-800 dark:text-brand-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  } ${!canView ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800">
                    {c.ticket ? (
                      <Ticket className="w-4 h-4 text-slate-500" />
                    ) : (
                      <Users className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold truncate mr-2">
                        {c.title}
                      </span>
                      {c.ticket && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.ticket.status === "InProgress"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {statusLabel[c.ticket.status] || c.ticket.status}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500 truncate">
                      {otherParticipants.map((p) => p.fullName).join("، ")}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 shrink-0">
                    {new Date(c.updatedAt).toLocaleDateString("ar-SA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* نافذة الرسائل (يمين) */}
      <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-slate-900">
        {!selectedConversationId ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
            يرجى اختيار محادثة من القائمة للبدء
          </div>
        ) : (
          <>
            <div className="h-12 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-brand-800/10 dark:bg-brand-500/10 text-brand-800 dark:text-brand-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    {activeConversation?.title || "محادثة"}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {activeConversation?.ticket
                      ? `مرتبطة بتذكرة #${activeConversation.ticket.id} - ${activeConversation.ticket.title}`
                      : `مشاركون: ${activeConversation.participants
                          .filter((p) => p.userId !== currentUser.id)
                          .map((p) => p.user.fullName)
                          .join("، ")}`}
                  </p>
                </div>
              </div>
              {activeConversation?.ticket && (
                <span
                  className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                    activeConversation.ticket.assignedToId === currentUser.id
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/40 dark:text-emerald-400"
                      : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  {isIt || isAdmin
                    ? activeConversation.ticket.assignedToId === currentUser.id
                      ? "مسندة إليك"
                      : "تذكرة عامة"
                    : "تذكرة"}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollEndRef}>
              {messagesLoading ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                  جاري تحميل الرسائل...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                  لا توجد رسائل في هذه المحادثة
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === currentUser.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm text-xs ${
                        msg.senderId === currentUser.id
                          ? "bg-brand-800 text-white rounded-br-md"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-md border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                      <span
                        className={`text-[10px] mt-1 block ${
                          msg.senderId === currentUser.id
                            ? "text-brand-200"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={scrollEndRef} />
            </div>
          </>
          )}
      </div>
    </div>
  );
}
