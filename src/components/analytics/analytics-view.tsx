"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export const AnalyticsView = () => {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "analytics",
      selectedStatus,
      selectedPriority,
      dateRange.start,
      dateRange.end,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus) params.append("status", selectedStatus);
      if (selectedPriority) params.append("priority", selectedPriority);
      if (dateRange.start) params.append("startDate", dateRange.start.toISOString());
      if (dateRange.end) params.append("endDate", dateRange.end.toISOString());

      const res = await fetch("/api/tasks/analytics?".concat(params.toString()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("فشل تحميل بيانات التحليل");
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-slate-400 animate-spin"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
          </svg>
          <span className="text-sm font-semibold">جاري تحميل بيانات التحليل...</span>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen p-6">
        <div className="text-center text-rose-600">
          <h3 className="mb-4">حدث خطأ</h3>
          <p>فشل تحميل بيانات التحليل. يرجى المحاولة مرة أخرى.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-brand-800 text-white rounded-md hover:bg-brand-900"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }}
