"use client";

import React, { useState } from "react";

interface ChatViewProps {
  currentUser?: {
    id: number;
    name: string;
    role: string;
  };
}

export function ChatView({ currentUser }: ChatViewProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, input]);
    setInput("");
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">المحادثة والدعم الفني</h2>
        {currentUser && (
          <span className="text-xs bg-rose-50 text-[#800020] px-3 py-1 rounded-full font-medium">
            مرحباً، {currentUser.name}
          </span>
        )}
      </div>
      <div className="h-96 overflow-y-auto border border-slate-100 dark:border-slate-800 p-4 mb-4 rounded-lg bg-slate-50 dark:bg-slate-950/50 space-y-3">
        {messages.length === 0 ? (
          <p className="text-slate-400 text-center mt-32 text-sm">لا توجد رسائل حالياً. ابدأ المحادثة الآن.</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg shadow-sm text-sm text-slate-700 dark:text-slate-200 max-w-md">
              {msg}
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب رسالتك..."
          className="flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]"
        />
        <button type="submit" className="bg-[#800020] hover:bg-[#600018] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition shadow">
          إرسال
        </button>
      </form>
    </div>
  );
}

export default ChatView;
