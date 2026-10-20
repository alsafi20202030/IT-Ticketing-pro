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

  useEffect(() => {
    fetch("/api/public/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
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

  const systemName = settings["SystemName"] || "IT Desk";
  const subtitle = settings["Subtitle"] || "بوابة طلبات الدعم الفني";
  const logoPath = settings["LogoPath"] || "/logo-placeholder.svg";
  const allowRegister = settings["AllowSelfRegistration"] === "true";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 font-cairo">
      {/* Brand Hero Panel */}
      <div className="md:w-1/2 bg-linear-to-br from-brand-900 via-brand-950 to-slate-950 text-white p-8 md:p-16 flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center">
            <img src={logoPath} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">{systemName}</h1>
            <p className="text-xs text-brand-200">{subtitle}</p>
          </div>
        </div>

        <div className="my-12 md:my-0 space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-semibold backdrop-blur-md">
            نظام موحد ومؤتمت للدعم الفني
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
            معًا نُبقي أعمالكم متصلة، وطلباتكم منجزة بسرعة واحترافية.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md">
            منصة رقمية متكاملة لاستقبال طلبات الدعم الفني وتقنية المعلومات، تتبع مراحل المعالجة، والالتزام باتفاقيات مستوى الخدمة بدقة وكفاءة.
          </p>
        </div>

        <div className="text-xs text-slate-400">
          {settings["CompanyName"] || "الشركة"} • {settings["FooterText"] || "بوابة الدعم الداخلي"}
        </div>
      </div>

      {/* Login Form Section */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">تسجيل الدخول</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              أدخل بيانات حسابك المعتمد للمتابعة إلى بوابة الدعم
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                البريد الإلكتروني أو اسم المستخدم
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.local أو admin"
                  className="w-full text-xs pr-10 pl-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                  className="w-full text-xs pr-10 pl-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-800 text-slate-800 dark:text-slate-200"
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
              className="w-full flex items-center justify-center gap-2 bg-brand-800 hover:bg-brand-900 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl text-xs shadow-md transition transform active:scale-98"
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
                className="text-xs text-brand-800 dark:text-brand-400 hover:underline font-semibold"
              >
                ليس لديك حساب؟ إنشاء حساب جديد
              </a>
            </div>
          )}

          <div className="text-center text-[11px] text-slate-400">
            الحساب الافتراضي للتجربة: <span className="font-mono text-slate-600 dark:text-slate-300">admin@itdesk.local</span> / كلمة المرور: <span className="font-mono text-slate-600 dark:text-slate-300">Pass@123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
