"use client";

import React, { useState } from "react";
import { X, Star, Send, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface RateModalProps {
  ticketId: number | null;
  onClose: () => void;
}

export function RateModal({ ticketId, onClose }: RateModalProps) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const rateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) throw new Error("فشل إرسال التقييم");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      onClose();
    },
  });

  if (!ticketId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white">تقييم جودة الدعم الفني</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500">كيف كانت تجربتك مع معالجة طلب الدعم الفني؟</p>

        {/* Stars */}
        <div className="flex justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              onClick={() => setRating(star)}
              className="p-1 transition transform hover:scale-110"
            >
              <Star
                className={`w-7 h-7 ${
                  (hoverRating !== null ? star <= hoverRating : star <= rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300 dark:text-slate-600"
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="ملاحظات أو تعليق إضافي (اختياري)..."
          className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden"
        />

        <button
          onClick={() => rateMutation.mutate()}
          disabled={rateMutation.isPending}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs flex items-center justify-center gap-2 transition"
        >
          {rateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>إرسال التقييم</span>
        </button>
      </div>
    </div>
  );
}
