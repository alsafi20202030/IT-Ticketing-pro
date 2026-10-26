"use client";

import React, { useState } from "react";

export function ChatView() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, input]);
    setInput("");
  };

  return (
    <div className="p-4 bg-white rounded-lg border shadow-sm">
      <h2 className="text-xl font-bold mb-4">المحادثة والدعم الفني</h2>
      <div className="h-64 overflow-y-auto border p-3 mb-4 rounded bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center">لا توجد رسائل حالياً.</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="p-2 mb-2 bg-blue-100 rounded text-sm">
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
          className="flex-1 border p-2 rounded"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          إرسال
        </button>
      </form>
    </div>
  );
}

export default ChatView;