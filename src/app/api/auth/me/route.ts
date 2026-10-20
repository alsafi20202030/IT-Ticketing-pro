import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      titlePrefix: user.titlePrefix,
      email: user.email,
      role: user.role,
      department: user.department?.name || null,
      departmentId: user.departmentId,
      mustChangePassword: user.mustChangePassword,
      canViewAllTickets: user.canViewAllTickets,
      canEditAnyTicket: user.canEditAnyTicket,
      canReassignTickets: user.canReassignTickets,
      isOnLeave: user.isOnLeave,
    },
  });
}
