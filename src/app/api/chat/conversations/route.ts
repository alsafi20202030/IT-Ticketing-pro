import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// قائمة المحادثات المتاحة للمستخدم المسجل
// الأدمن يرى جميع المحادثات، موظف الـ IT يرى محادثات التذاكر المسندة إليه شخصياً,
// والمستخدم العادي يرى محادثات تذاكره فقط.
export async function GET(req: Request) {
  const auth = await requireAuth(["IT", "Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const isAdmin = user.role === "Admin";
  const isIt = user.role === "IT";

  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get("ticketId");

  const where: any = {};
  if (ticketId) {
    where.ticketId = parseInt(ticketId, 10);
  }

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      ticket: { select: { id: true, title: true, status: true, assignedToId: true } },
      participants: {
        include: { user: { select: { id: true, fullName: true, role: true } } },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // تصفية حسب صلاحية العرض
  let accessible = conversations;
  if (!isAdmin) {
    accessible = accessible.filter((c) => {
      // يجب أن يكون المستخدم مشاركاً في المحادثة
      const isParticipant = c.participants.some((p) => p.userId === user.id);
      if (!isParticipant) return false;
      // موظف الـ IT يرى فقط محادثات التذاكر المسندة إليه شخصياً (أو محادثة بلا تذكرة)
      if (isIt) {
        if (!c.ticketId) return true;
        return c.ticket?.assignedToId === user.id;
      }
      // المستخدم العادي يرى محادثات تذاكره
      return true;
    });
  }

  return NextResponse.json({ conversations: accessible });
}

// إنشاء محادثة جديدة
// body: { title?, ticketId?, participantIds?: number[] }
export async function POST(req: Request) {
  const auth = await requireAuth(["IT", "Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const body = await req.json();
  const { title, ticketId, participantIds = [] } = body;

  if (ticketId) {
    const tId = parseInt(ticketId, 10);
    if (isNaN(tId)) {
      return NextResponse.json({ message: "معرف التذكرة غير صالح" }, { status: 400 });
    }
    const ticket = await prisma.ticket.findUnique({ where: { id: tId } });
    if (!ticket) {
      return NextResponse.json({ message: "التذكرة غير موجودة" }, { status: 404 });
    }
    const canView =
      user.role === "Admin" ||
      user.role === "IT" ||
      ticket.requesterId === user.id ||
      ticket.assignedToId === user.id;
    if (!canView) {
      return NextResponse.json(
        { message: "ليس لديك صلاحية لفتح محادثة على هذه التذكرة" },
        { status: 403 }
      );
    }
  }

  const participants = Array.from(new Set([...participantIds, user.id]));
  if (participants.length < 2 && !ticketId) {
    return NextResponse.json(
      { message: "يجب إضافة مشارك واحد على الأقل" },
      { status: 400 }
    );
  }

  try {
    const conversation = await prisma.conversation.create({
      data: {
        title: title?.trim() || "محادثة جديدة",
        ticketId: ticketId ? parseInt(ticketId, 10) : null,
        participants: {
          create: participants.map((pid) => ({ userId: pid })),
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, fullName: true, role: true } } },
        },
      },
    });

    await prisma.activityEntry.create({
      data: {
        userId: user.id,
        userName: user.fullName,
        action: `إنشاء محادثة رقم #${conversation.id} (${conversation.title})`,
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { message: e.message || "فشل إنشاء المحادثة" },
      { status: 500 }
    );
  }
}