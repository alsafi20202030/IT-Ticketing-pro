import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { prisma } from "@/lib/prisma";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

export async function generateMetadata() {
  const portal = await prisma.systemSetting.findUnique({
    where: { key: "PortalTitle" },
    select: { value: true },
  });
  return {
    title: (portal?.value || "IT Desk | بوابة طلبات الدعم الفني") as string,
    description:
      "نظام داخلي موحد لإدارة ومتابعة طلبات الدعم الفني وتقنية المعلومات",
    icons: {
      icon: "/favicon.svg",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [primary, secondary, background] = await Promise.all([
    prisma.systemSetting.findUnique({
      where: { key: "PrimaryColor" },
      select: { value: true },
    }),
    prisma.systemSetting.findUnique({
      where: { key: "SecondaryColor" },
      select: { value: true },
    }),
    prisma.systemSetting.findUnique({
      where: { key: "BackgroundPath" },
      select: { value: true },
    }),
  ]);
  const accent = (primary?.value || "#7a1f3d") as string;
  const second = (secondary?.value || "#c0846e") as string;
  const bgPath = background?.value || null;

  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('itdesk_theme');
                if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root { --brand-accent: ${accent}; --brand-secondary: ${second}; }
              .bg-brand-800 { background-color: ${accent} !important; }
              .text-brand-800 { color: ${accent} !important; }
              .border-brand-800 { border-color: ${accent} !important; }
              .bg-brand-secondary { background-color: ${second} !important; }
              .text-brand-secondary { color: ${second} !important; }
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen text-slate-900 dark:text-slate-100 antialiased font-cairo"
        style={{
          "--brand-accent": accent,
          backgroundImage: bgPath ? `url("${bgPath}")` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
        } as React.CSSProperties}
      >
        <div className="relative min-h-screen bg-slate-50/75 dark:bg-slate-950/85 backdrop-blur-sm">
          <QueryProvider>{children}</QueryProvider>
        </div>
      </body>
    </html>
  );
}

