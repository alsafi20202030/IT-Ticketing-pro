"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";

const FIELDS = [
  { key: "loginTitle", label: "Title", type: "text" },
  { key: "loginSubtitle", label: "Subtitle", type: "text" },
  { key: "loginPrimaryColor", label: "Primary Color", type: "color" },
  { key: "loginBackgroundColor", label: "Background Color", type: "color" },
  { key: "loginCardColor", label: "Card Color", type: "color" },
  { key: "loginTextColor", label: "Text Color", type: "color" },
  { key: "loginFooterText", label: "Footer Text", type: "text" },
  { key: "loginCompanyName", label: "Company Name", type: "text" },
];

export function LoginDesignView() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin_system_settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/system-settings");
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
  });

  useEffect(() => {
    if (data && !loaded) {
      const next: Record<string, string> = {};
      for (const f of FIELDS) next[f.key] = data[f.key] || "";
      setForm(next);
      setLoaded(true);
    }
  }, [data, loaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/system-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "fail");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_system_settings"] });
      alert("Saved");
    },
    onError: (e: any) => alert(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-800 dark:text-white">
          Login Page Design
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {f.label}
            </label>
            <input
              type={f.type}
              value={form[f.key] || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        ))}

        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
        </button>
      </div>
    </div>
  );
}

export default LoginDesignView;
