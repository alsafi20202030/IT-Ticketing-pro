"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, Check, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function SettingsView() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [savedMessage, setSavedMessage] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin_settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_settings"] });
      queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2500);
    },
  });

  const handleChange = (key: string, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-slate-400">جاري تحميل الإعدادات...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white">إعدادات النظام والهوية</h2>
          <p className="text-xs text-slate-500">تخصيص اسم المنصة، سياسات التسجيل، وساعات اتفاقية SLA.</p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 bg-brand-800 hover:bg-brand-900 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>حفظ التغييرات</span>
        </button>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>تم حفظ الإعدادات بنجاح وتحديث النظام!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branding */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="font-bold text-xs text-slate-800 dark:text-white">الهوية البصرية والمسميات</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">اسم النظام</label>
            <input
              type="text"
              value={settings["SystemName"] || ""}
              onChange={(e) => handleChange("SystemName", e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">العنوان الفرعي</label>
            <input
              type="text"
              value={settings["Subtitle"] || ""}
              onChange={(e) => handleChange("Subtitle", e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">اسم الشركة / المنشأة</label>
            <input
              type="text"
              value={settings["CompanyName"] || ""}
              onChange={(e) => handleChange("CompanyName", e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">نص التذييل (Footer)</label>
            <input
              type="text"
              value={settings["FooterText"] || ""}
              onChange={(e) => handleChange("FooterText", e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>

        {/* SLA Times */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="font-bold text-xs text-slate-800 dark:text-white">ساعات اتفاقية مستوى الخدمة (SLA)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-rose-600 mb-1">أولوية حرجة (Urgent)</label>
              <input
                type="number"
                value={settings["SlaUrgentHours"] || "4"}
                onChange={(e) => handleChange("SlaUrgentHours", e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-orange-600 mb-1">أولوية مرتفعة (High)</label>
              <input
                type="number"
                value={settings["SlaHighHours"] || "24"}
                onChange={(e) => handleChange("SlaHighHours", e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-600 mb-1">أولوية متوسطة (Medium)</label>
              <input
                type="number"
                value={settings["SlaMediumHours"] || "72"}
                onChange={(e) => handleChange("SlaMediumHours", e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">أولوية منخفضة (Low)</label>
              <input
                type="number"
                value={settings["SlaLowHours"] || "72"}
                onChange={(e) => handleChange("SlaLowHours", e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Registration Policies */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs md:col-span-2">
          <h3 className="font-bold text-xs text-slate-800 dark:text-white">سياسات التسجيل والوصول</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={settings["AllowSelfRegistration"] === "true"}
                onChange={(e) => handleChange("AllowSelfRegistration", String(e.target.checked))}
                className="rounded-sm border-slate-300 text-brand-800"
              />
              <span>السماح بالتسجيل الذاتي</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={settings["RegistrationRequiresApproval"] === "true"}
                onChange={(e) => handleChange("RegistrationRequiresApproval", String(e.target.checked))}
                className="rounded-sm border-slate-300 text-brand-800"
              />
              <span>التسجيل يتطلب موافقة الإدارة</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={settings["AllowRequesterAssigneeChoice"] === "true"}
                onChange={(e) => handleChange("AllowRequesterAssigneeChoice", String(e.target.checked))}
                className="rounded-sm border-slate-300 text-brand-800"
              />
              <span>السماح للعميل باختيار موظف الدعم</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
