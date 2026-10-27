// "use client";

// import React, { useState } from "react";
// import {
//   Search,
//   Clock,
//   Loader2,
//   User,
//   Building2,
//   Ticket,
//   Filter,
//   CheckCircle2,
//   X,
// } from "lucide-react";
// import { useQuery } from "@tanstack/react-query";

// interface CurrentUser {
//   id: number;
//   fullName: string;
//   titlePrefix: string;
//   role: string;
//   department: string | null;
//   departmentId: number | null;
//   canViewAllTickets: boolean;
//   canEditAnyTicket: boolean;
//   canReassignTickets: boolean;
// }

// interface UnassignedTicketsViewProps {
//   currentUser: CurrentUser;
// }

// interface UnassignedTicket {
//   id: number;
//   title: string;
//   description: string;
//   status: string;
//   priority: string;
//   category: { id: number; name: string };
//   requester: { id: number; fullName: string; titlePrefix: string; department: { id: number; name: string } | null };
//   createdAt: string;
//   updatedAt: string;
//   _count: { comments: number };
// }

// export function UnassignedTicketsView({ currentUser }: UnassignedTicketsViewProps) {
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");

//   const isAdmin = currentUser.role === "Admin";
//   const canViewAll = currentUser.canViewAllTickets || isAdmin;

//   const { data, isLoading } = useQuery<{ tickets: UnassignedTicket[] }>({
//     queryKey: ["tickets", "unassigned", search, statusFilter],
//     queryFn: async () => {
//       const params = new URLSearchParams();
//       if (search) params.set("search", search);
//       if (statusFilter !== "all") params.set("status", statusFilter);
//       params.set("scope", "unassigned");
//       const res = await fetch(`/api/tickets?${params.toString()}`);
//       if (!res.ok) throw new Error("فشل تحميل التذاكر غير المسندة");
//       return res.json();
//     },
//     refetchInterval: 20000,
//   });

//   const tickets = data?.tickets || [];

//   const priorityConfig = {
//     Urgent: { label: "حرجة", badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 font-bold" },
//     High: { label: "مرتفعة", badge: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400" },
//     Medium: { label: "متوسطة", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" },
//     Low: { label: "منخفضة", badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
//   };

//   const statusConfig = {
//     New: { label: "جديدة", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400" },
//     InProgress: { label: "قيد المعالجة", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400" },
//     WaitingEmployee: { label: "بانتظار الموظف", bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-400" },
//     Resolved: { label: "تم الحل", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400" },
//     Closed: { label: "مغلقة", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h2 className="text-base font-bold text-slate-800 dark:text-white">التذاكر غير المسندة</h2>
//           <p className="text-xs text-slate-500">تذاكر الدعم التي لم تسند بعد لعامل دعم.</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//             <input
//               type="text"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               placeholder="بحث بشرط/طالب/رقم تذكرة..."
//               className="w-full sm:w-64 pl-9 pr-3 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400"
//             />
//           </div>
//           <div className="relative">
//             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//             <select
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               className="pl-9 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
//             >
//               <option value="all">كل الحالة</option>
//               <option value="New">جديدة</option>
//               <option value="InProgress">قيد المعالجة</option>
//               <option value="WaitingEmployee">بانتظار الموظف</option>
//               <option value="Resolved">تم الحل</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {isLoading ? (
//         <div className="flex items-center justify-center py-12 text-slate-400">
//           <Loader2 className="w-6 h-6 animate-spin" />
//         </div>
//       ) : tickets.length === 0 ? (
//         <div className="text-center py-16">
//           <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
//             <Ticket className="w-8 h-8 text-slate-400" />
//           </div>
//           <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">لا توجد تذاكر غير مسندة</h3>
//           <p className="text-xs text-slate-400 mt-1">جميع التذاكر حالياً مسندة لعمال الدعم</p>
//         </div>
//       ) : (
//         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full text-xs">
//               <thead>
//                 <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
//                   <th className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400">التذكرة</th>
//                   <th className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400">الطالب</th>
//                   <th className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400">القسم</th>
//                   <th className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400">الأولوية</th>
//                   <th className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400">التاريخ</th>
//                   <th className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400">الحالة</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {tickets.map((ticket: UnassignedTicket) => (
//                   <tr
//                     key={ticket.id}
//                     className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
//                   >
//                     <td className="py-3.5 px-4">
//                       <div className="flex items-center gap-2">
//                         <span className="font-mono font-bold text-slate-800 dark:text-slate-200">#{ticket.id}</span>
//                         <span className="max-w-[200px] truncate text-xs text-slate-600 dark:text-slate-400">{ticket.title}</span>
//                       </div>
//                     </td>
//                     <td className="py-3.5 px-4">
//                       <div className="flex items-center gap-2">
//                         <User className="w-3.5 h-3.5 text-slate-400" />
//                         <span className="text-xs text-slate-700 dark:text-slate-300">{ticket.requester.titlePrefix} {ticket.requester.fullName}</span>
//                       </div>
//                       <div className="text-[11px] text-slate-400">{ticket.requester.department?.name || "قسم غير محدد"}</div>
//                     </td>
//                     <td className="py-3.5 px-4">
//                       <div className="flex items-center gap-2">
//                         <Building2 className="w-3.5 h-3.5 text-slate-400" />
//                         <span className="text-xs text-slate-700 dark:text-slate-300">{ticket.category.name}</span>
//                       </div>
//                     </td>
//                     <td className="py-3.5 px-4">
//                       <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${priorityConfig[ticket.priority]?.badge || priorityConfig.Urgent.badge}`}>
//                         {priorityConfig[ticket.priority]?.label || priorityConfig.Urgent.label}
//                       </span>
//                     </td>
//                     <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
//                       <div className="flex items-center gap-1 text-right">
//                         <Clock className="w-3.5 h-3.5 text-slate-400" />
//                         <span className="text-[11px]">
//                           {new Date(ticket.createdAt).toLocaleDateString("ar-SA", { day: "2-digit", month: "short", year: "numeric" })}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="py-3.5 px-4">
//                       <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConfig[ticket.status]?.bg || statusConfig.New.bg} ${statusConfig[ticket.status]?.text || statusConfig.New.text}`}>
//                         {statusConfig[ticket.status]?.label || statusConfig.New.label}
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {tickets.length > 0 && (
//             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
//               <span className="text-xs text-slate-500">عرض {tickets.length} تذكرة غير مسندة</span>
//               <div className="flex gap-2">
//                 <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition">
//                   <CheckCircle2 className="w-4 h-4" />
//                   توزيع
//                 </button>
//                 <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold rounded-xl transition">
//                   <X className="w-4 h-4" />
//                   إلغاء المسندة
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }
"use client";

import React, { useState } from "react";
import {
  Search,
  Clock,
  Loader2,
  User,
  Building2,
  Ticket,
  Filter,
  CheckCircle2,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface CurrentUser {
  id: number;
  fullName: string;
  titlePrefix: string;
  role: string;
  department: string | null;
  departmentId: number | null;
  canViewAllTickets: boolean;
  canEditAnyTicket: boolean;
  canReassignTickets: boolean;
}

interface UnassignedTicketsViewProps {
  currentUser: CurrentUser;
}

interface UnassignedTicket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: { id: number; name: string };
  requester: { id: number; fullName: string; titlePrefix: string; department: { id: number; name: string } | null };
  createdAt: string;
  updatedAt: string;
  _count: { comments: number };
}

export function UnassignedTicketsView({ currentUser }: UnassignedTicketsViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const isAdmin = currentUser.role === "Admin";
  const canViewAll = currentUser.canViewAllTickets || isAdmin;

  const { data, isLoading } = useQuery<{ tickets: UnassignedTicket[] }>({
    queryKey: ["tickets", "unassigned", search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("scope", "unassigned");
      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (!res.ok) throw new Error("فشل تحميل التذاكر غير المسندة");
      return res.json();
    },
    refetchInterval: 20000,
  });

  const tickets = data?.tickets || [];

  const priorityConfig: Record<string, { label: string; badge: string }> = {
    Urgent: { label: "حرجة", badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 font-bold" },
    High: { label: "مرتفعة", badge: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400" },
    Medium: { label: "متوسطة", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" },
    Low: { label: "منخفضة", badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  };

  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    New: { label: "جديدة", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400" },
    InProgress: { label: "قيد المعالجة", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400" },
    WaitingEmployee: { label: "بانتظار الموظف", bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-400" },
    Resolved: { label: "تم الحل", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400" },
    Closed: { label: "مغلقة", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white">التذاكر غير المسندة</h2>
          <p className="text-xs text-slate-500">تذاكر الدعم التي لم تسند بعد لعامل دعم.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بشرط/طالب/رقم تذكرة..."
              className="w-full sm:w-64 pl-9 pr-3 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
            >
              <option value="all">كل الحالة</option>
              <option value="New">جديدة</option>
              <option value="InProgress">قيد المعالجة</option>
              <option value="WaitingEmployee">بانتظار الموظف</option>
              <option value="Resolved">تم الحل</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Ticket className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">لا توجد تذاكر غير مسندة</h3>
          <p className="text-xs text-slate-400 mt-1">جميع التذاكر حالياً مسندة لعمال الدعم</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400">التذكرة</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400">الطالب</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400">القسم</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400">الأولوية</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400">التاريخ</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket: UnassignedTicket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">#{ticket.id}</span>
                        <span className="max-w-[200px] truncate text-xs text-slate-600 dark:text-slate-400">{ticket.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-700 dark:text-slate-300">{ticket.requester.titlePrefix} {ticket.requester.fullName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{ticket.requester.department?.name || "قسم غير محدد"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-700 dark:text-slate-300">{ticket.category.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${priorityConfig[ticket.priority]?.badge || priorityConfig.Urgent.badge}`}>
                        {priorityConfig[ticket.priority]?.label || priorityConfig.Urgent.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1 text-right">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px]">
                          {new Date(ticket.createdAt).toLocaleDateString("ar-SA", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConfig[ticket.status]?.bg || statusConfig.New.bg} ${statusConfig[ticket.status]?.text || statusConfig.New.text}`}>
                        {statusConfig[ticket.status]?.label || statusConfig.New.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tickets.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">عرض {tickets.length} تذكرة غير مسندة</span>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition">
                  <CheckCircle2 className="w-4 h-4" />
                  توزيع
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold rounded-xl transition">
                  <X className="w-4 h-4" />
                  إلغاء المسندة
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}