"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loginSettings, setLoginSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/public/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() => {});
    fetch("/api/public/system-settings")
      .then((res) => res.json())
      .then((data) => setLoginSettings(data || {}))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "فشل تسجيل الدخول");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
      setLoading(false);
    }
  };

  // القيم الديناميكية التي يتحكم بها الأدمن أو إعدادات النظام (مع نصوص افتراضية محدثة)
  const systemName = loginSettings.loginTitle || settings["SystemName"] || "IT Desk";
  const subtitle = loginSettings.loginSubtitle || settings["Subtitle"] || "بوابة إدارة المهام والأعمال";
  const logoPath = settings["LogoPath"] || "/logo-placeholder.svg";
  const allowRegister = settings["AllowSelfRegistration"] === "true";
  const primaryColor = loginSettings.loginPrimaryColor || "#7A1F3D";
  const bgColor = loginSettings.loginBackgroundColor || "#f8fafc";
  const cardColor = loginSettings.loginCardColor || "#ffffff";
  const textColor = loginSettings.loginTextColor || "#1e293b";
  
  // النصوص الديناميكية للجانب الأيمن/الأيسر (تحدثت فقط الأجزاء النصية الاحتياطية)
  const heroBadge = loginSettings.loginHeroBadge || "المنصة الموحدة لإدارة الأعمال والمهام";
  const heroTitle = loginSettings.loginHeroTitle ||"رتّب مهامك وأنجز أعمالك بدقة واحترافية";
  const heroDescription = loginSettings.loginHeroDescription ||"نظام رقمي متكامل يربط بين إدارة المهام اليومية للموظفين وتنظيم الطلبات التقنية في مكان واحد لضمان أعلى مستويات الإنتاجية";
  
  const footerText = loginSettings.loginFooterText || settings["FooterText"] || "بوابة الأعمال الداخلية";
  const companyName = loginSettings.loginCompanyName || settings["CompanyName"] || "";

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-cairo" style={{ backgroundColor: bgColor }}>
      {/* Brand Hero Panel - ديناميكي بالكامل */}
      <div 
        className="md:w-1/2 text-white p-8 md:p-16 flex flex-col justify-between"
        style={{
          background: loginSettings.loginHeroBgGradient || "linear-gradient(to bottom right, #7A1F3D, #4a1024, #020617)"
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center">
            <img src={logoPath} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">{systemName}</h1>
            <p className="text-xs text-brand-200 opacity-90">{subtitle}</p>
          </div>
        </div>

        <div className="my-12 md:my-0 space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-semibold backdrop-blur-md">
            {heroBadge}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
            {heroTitle}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md">
            {heroDescription}
          </p>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          {companyName && <span>{companyName}</span>}
          {companyName && footerText && <span>•</span>}
          <span>{footerText}</span>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div 
          className="max-w-md w-full p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6" 
          style={{ backgroundColor: cardColor, color: textColor }}
        >
          <div className="space-y-1">
            <h2 className="text-2xl font-black">تسجيل الدخول</h2>
            <p className="text-xs opacity-70">
              أدخل بيانات حسابك المعتمد للمتابعة إلى بوابة النظام
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-90">
                البريد الإلكتروني أو اسم المستخدم
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.local أو اسم المستخدم"
                  className="w-full text-xs pr-10 pl-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-90">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pr-10 pl-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl text-xs shadow-md transition transform active:scale-98"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {allowRegister && (
            <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <a
                href="/register"
                className="text-xs hover:underline font-semibold"
                style={{ color: primaryColor }}
              >
                ليس لديك حساب؟ إنشاء حساب جديد
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
