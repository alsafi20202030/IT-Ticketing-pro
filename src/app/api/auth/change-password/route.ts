import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { currentPassword, newPassword, confirmPassword } = await req.json();

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ message: "كلمة المرور الجديدة يجب أن لا تقل عن 6 خانات" }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ message: "كلمة المرور وتأكيدها غير متطابقين" }, { status: 400 });
  }

  if (!auth.user.mustChangePassword) {
    if (!currentPassword) {
      return NextResponse.json({ message: "يرجى إدخال كلمة المرور الحالية" }, { status: 400 });
    }
    const isCurrentValid = await verifyPassword(currentPassword, auth.user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json({ message: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
    }
  }

  const newHash = await hashPassword(newPassword);

  await prisma.helpdeskUser.update({
    where: { id: auth.user.id },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  await prisma.activityEntry.create({
    data: {
      userId: auth.user.id,
      userName: auth.user.fullName,
      action: "تغيير كلمة المرور",
    },
  });

  return NextResponse.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
}
