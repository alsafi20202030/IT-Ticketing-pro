"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { OverviewView } from "@/components/dashboard/overview-view";
import { TicketsListView } from "@/components/tickets/tickets-list-view";
import { TeamWorkloadView } from "@/components/team/team-workload-view";
import { EmployeeTasksView } from "@/components/tasks/employee-tasks-view";
import { UsersView } from "@/components/admin/users-view";
import { DepartmentsView } from "@/components/admin/departments-view";
import { RulesView } from "@/components/admin/rules-view";
import { SettingsView } from "@/components/admin/settings-view";
import { ActivityView } from "@/components/admin/activity-view";
import { StaffRolesView } from "@/components/admin/staff-roles-view";
import { LoginDesignView } from "@/components/admin/login-design-view";
import { ChatView } from "@/components/chat/ChatView";
import { CalendarView } from "@/components/calendar/calendar-view";
import { UnassignedTicketsView } from "@/components/tickets/unassigned-tickets-view";
import { NewTicketModal } from "@/components/tickets/new-ticket-modal";
import { TicketModal } from "@/components/tickets/ticket-modal";
import { RateModal } from "@/components/tickets/rate-modal";
import { ChangePasswordModal } from "@/components/tickets/change-password-modal";
import { Loader2 } from "lucide-react";

export default function MainPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState("tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [rateTicketId, setRateTicketId] = useState<number | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Bootstrap query fetches user session, categories, departments, staff, settings
  const { data: bootData, isLoading, isError } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: async () => {
      const res = await fetch("/api/bootstrap");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        throw new Error("فشل تحميل بيانات الجلسة");
      }
      return res.json();
    },
    retry: false,
  });

  const user = bootData?.user;
  const isItOrAdmin = user?.role === "IT" || user?.role === "Admin";

  // Set default tab to overview if staff, otherwise tickets
  useEffect(() => {
    if (user && isItOrAdmin && currentTab === "tickets") {
      setCurrentTab("overview");
    }
  }, [user, isItOrAdmin]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (isLoading || !bootData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-800" />
        <span className="text-xs font-semibold">جاري تهيئة مساحة عمل IT Desk...</span>
      </div>
    );
  }

  const tabTitles: Record<string, string> = {
    overview: "نظرة عامة ومؤشرات الأداء",
    tickets: "بوابة طلبات وتذاكر الدعم",
    team: "فريق الدعم الفني وأعباء العمل",
    tasks: "مهام موظفي قسم IT",
    users: "إدارة المستخدمين والصلاحيات",
    departments: "إدارة الأقسام والوحدات",
    rules: "قواعد الإسناد التلقائي",
    settings: "إعدادات النظام والهوية",
    activity: "سجل العمليات والتدقيق",
    chat: "المحادثات",
    calendar: "تقويم موظفي IT",
    unassigned: "استلام التذاكر العامة",
    staffRoles: "مسميات موظفي IT",
    loginDesign: "تصميم صفحة تسجيل الدخول",
  };

  const pubSettings = bootData.publicSettings || {};

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-cairo">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        userRole={user.role}
        onOpenNewTicket={() => setIsNewTicketOpen(true)}
        systemName={pubSettings.SystemName}
        logoPath={pubSettings.LogoPath}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          user={user}
          currentTabTitle={tabTitles[currentTab] || "بوابة الدعم"}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {currentTab === "overview" && isItOrAdmin && (
            <OverviewView onSelectTicket={(id) => setSelectedTicketId(id)} />
          )}

          {currentTab === "tickets" && (
            <TicketsListView
              onSelectTicket={(id) => setSelectedTicketId(id)}
              onOpenNewTicket={() => setIsNewTicketOpen(true)}
              categories={bootData.categories || []}
              staff={bootData.staff || []}
              userRole={user.role}
              slaHours={bootData.slaHours}
            />
          )}

          {currentTab === "team" && isItOrAdmin && <TeamWorkloadView />}

          {currentTab === "tasks" && isItOrAdmin && (
            <EmployeeTasksView currentUser={user} staff={bootData.staff || []} />
          )}

          {currentTab === "users" && user.role === "Admin" && (
            <UsersView departments={bootData.departments || []} />
          )}

          {currentTab === "departments" && user.role === "Admin" && <DepartmentsView />}

          {currentTab === "rules" && user.role === "Admin" && <RulesView />}

          {currentTab === "settings" && user.role === "Admin" && <SettingsView />}

          {currentTab === "activity" && user.role === "Admin" && <ActivityView />}

          {currentTab === "chat" && isItOrAdmin && <ChatView currentUser={user} />}

          {currentTab === "calendar" && isItOrAdmin && (
            <CalendarView currentUser={user} staff={bootData.staff || []} />
          )}

          {currentTab === "unassigned" && isItOrAdmin && (
            <UnassignedTicketsView currentUser={user} />
          )}

          {currentTab === "staffRoles" && user.role === "Admin" && (
            <StaffRolesView />
          )}
           {currentTab === "loginDesign" && user.role === "Admin" && (
             <LoginDesignView />
           )}
        </main>
      </div>

      {/* Modals */}
      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        categories={bootData.categories || []}
        staff={bootData.staff || []}
        requesters={bootData.requesters || []}
        isItOrAdmin={isItOrAdmin}
        allowAssigneeChoice={pubSettings.AllowRequesterAssigneeChoice === "true"}
      />

      <TicketModal
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        currentUser={user}
        staff={bootData.staff || []}
        slaHours={bootData.slaHours}
        onOpenRateModal={(id) => {
          setSelectedTicketId(null);
          setRateTicketId(id);
        }}
      />

      <RateModal ticketId={rateTicketId} onClose={() => setRateTicketId(null)} />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen || user.mustChangePassword}
        onClose={() => setIsChangePasswordOpen(false)}
        mustChange={user.mustChangePassword}
      />
    </div>
  );
}
