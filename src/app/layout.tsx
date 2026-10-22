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
  const brand = await prisma.systemSetting.findUnique({
    where: { key: "PrimaryColor" },
    select: { value: true },
  });
  const accent = (brand?.value || "#7a1f3d") as string;

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
              :root { --brand-accent: ${accent}; }
              .bg-brand-800 { background-color: ${accent} !important; }
              .text-brand-800 { color: ${accent} !important; }
              .border-brand-800 { border-color: ${accent} !important; }
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased font-cairo"
        style={{ "--brand-accent": accent } as React.CSSProperties}
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

