"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Check,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function SettingsView() {
  const queryClient = useQueryClient();
  const [savedSettings, setSavedSettings] = useState<Record<string, string>>({});
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin_settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (data) {
      setSavedSettings(data);
      setPendingChanges({});
      setSaveStatus("idle");
      setSaveMessage("");
    }
  }, [data]);

  const hasChanges = Object.keys(pendingChanges).length > 0;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "يوجد تعديلات غير محفوظة. هل أنت متأكد من مغادرة الصفحة؟";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingChanges),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "فشل حفظ الإعدادات");
      }
      return res.json();
    },
    onSuccess: () => {
      setSavedSettings((prev) => ({ ...prev, ...pendingChanges }));
      setPendingChanges({});
      setSaveStatus("success");
      setSaveMessage("تم حفظ جميع التغييرات بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin_settings"] });
      queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 4000);
    },
    onError: (e: any) => {
      setSaveStatus("error");
      setSaveMessage(e.message || "حدث خطأ أثناء حفظ التغييرات");
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 5000);
    },
  });

  const handleChange = (key: string, val: string) => {
    setPendingChanges((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveAll = () => {
    if (!hasChanges) return;
    setSaveStatus("saving");
    setSaveMessage("جاري حفظ جميع التغييرات...");
    saveMutation.mutate();
  };

  const handleCancel = () => {
    setPendingChanges({});
    setSaveStatus("idle");
    setSaveMessage("");
  };

  const getValue = (key: string, def: string) => {
    return (pendingChanges[key] ?? savedSettings[key]) || def;
  };

  const getChecked = (key: string) => {
    return (pendingChanges[key] ?? savedSettings[key]) === "true";
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {saveStatus === "success" && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600" />
          <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{saveMessage}</span>
        </div>
      )}
      {saveStatus === "error" && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span className="text-sm text-rose-700 dark:text-rose-400 font-medium">{saveMessage}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">إعدادات النظام</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">قم بإجراء التعديلات واضغط على "حفظ جميع التغييرات" لتطبيقها.</p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-800 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إلغاء التغييرات</span>
              </button>
            )}
            <button
              onClick={handleSaveAll}
              disabled={!hasChanges || saveStatus === "saving"}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#800020] hover:bg-[#600018] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-xl transition shadow"
            >
              {saveStatus === "saving" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>حفظ جميع التغييرات</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-xs text-slate-800 dark:text-white mb-4">معلومات النظام</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">اسم النظام</label>
                <input type="text" value={getValue("SystemName", "IT Desk")} onChange={(e) => handleChange("SystemName", e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الشعار الفرعي</label>
                <input type="text" value={getValue("Subtitle", "بوابة طلبات الدعم الفني")} onChange={(e) => handleChange("Subtitle", e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">اسم الشركة</label>
                <input type="text" value={getValue("CompanyName", "الشركة")} onChange={(e) => handleChange("CompanyName", e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">نص التذييل</label>
                <input type="text" value={getValue("FooterText", "بوابة الدعم الداخلي")} onChange={(e) => handleChange("FooterText", e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">اللون الأساسي</label>
                <input type="color" value={getValue("PrimaryColor", "#7A1F3D")} onChange={(e) => handleChange("PrimaryColor", e.target.value)} className="w-full h-10 rounded-xl border-none bg-transparent cursor-pointer" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">مسار الشعار</label>
                <input type="text" value={getValue("LogoPath", "/logo-placeholder.svg")} onChange={(e) => handleChange("LogoPath", e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-xs text-slate-800 dark:text-white mb-4">اتفاقيات مستوى الخدمة (SLA)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-rose-600 mb-1">أولوية عاجلة (Urgent) - ساعات</label>
                <input type="number" value={getValue("SlaUrgentHours", "4")} onChange={(e) => handleChange("SlaUrgentHours", e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-orange-600 mb-1">أولوية عالية (High)</label>
                <input type="number" value={getValue("SlaHighHours", "24")} onChange={(e) => handleChange("SlaHighHours", e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-600 mb-1">أولوية متوسطة (Medium)</label>
                <input type="number" value={getValue("SlaMediumHours", "72")} onChange={(e) => handleChange("SlaMediumHours", e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">أولوية منخفضة (Low)</label>
                <input type="number" value={getValue("SlaLowHours", "72")} onChange={(e) => handleChange("SlaLowHours", e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-xs text-slate-800 dark:text-white mb-4">سياسات التسجيل والوصول</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={getChecked("AllowSelfRegistration")} onChange={(e) => handleChange("AllowSelfRegistration", String(e.target.checked))} className="rounded-sm border-slate-300 text-brand-800" />
                <span>السماح بالتسجيل الذاتي</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={getChecked("RegistrationRequiresApproval")} onChange={(e) => handleChange("RegistrationRequiresApproval", String(e.target.checked))} className="rounded-sm border-slate-300 text-brand-800" />
                <span>التسجيل يتطلب موافقة الإدارة</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={getChecked("AllowRequesterAssigneeChoice")} onChange={(e) => handleChange("AllowRequesterAssigneeChoice", String(e.target.checked))} className="rounded-sm border-slate-300 text-brand-800" />
                <span>السماح للعميل باختيار موظف الدعم</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}