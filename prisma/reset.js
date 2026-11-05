const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "يجب ضبط متغيري البيئة ADMIN_EMAIL و ADMIN_PASSWORD قبل تشغيل إعادة التهيئة (لا تُستخدم كلمة مرور افتراضية مكشوفة)."
    );
  }

  if (adminPassword.length < 8) {
    throw new Error("كلمة مرور responsabile يجب أن تكون 8 أحرف على الأقل.");
  }

  console.log("بدء إعادة تهيئة قاعدة البيانات (البيانات التشغيلية فقط)...");

  // حذف البيانات التشغيلية بالترترام respect للعلاقات (الأطفال أولاً)
  await prisma.employeeTask.deleteMany({});
  await prisma.ticketMessage.deleteMany({});
  await prisma.ticketComment.deleteMany({});
  await prisma.ticketHistory.deleteMany({});
  await prisma.ticketDelayReason.deleteMany({});
  await prisma.userNotification.deleteMany({});
  await prisma.conversationParticipant.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.activityEntry.deleteMany({});

  // حذف جميع حسابات المستخدمين الحالية
  const deletedUsers = await prisma.helpdeskUser.deleteMany({});
  console.log(`تم حذف ${deletedUsers.count} مستخدم.`);

  // الاحتفاظ بـ: Department, Category, SystemSetting, SystemSettings, StaffRole, AssignmentRule, CannedReply
  // (الهيكل والإعدادات الأساسية تبقى كما هي)

  // إنشاء حساب المسؤول الأول بشكل آمن (يُطلب تغيير كلمة المرور عند أول دخول)
  const bcrypt = require("bcryptjs");
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const itDept = await prisma.department.findFirst({ where: { name: "تقنية المعلومات" } });

  const admin = await prisma.helpdeskUser.create({
    data: {
      fullName: "مسؤول النظام",
      titlePrefix: "م.",
      email: adminEmail.toLowerCase().trim(),
      userName: "admin",
      jobTitle: "مدير النظام",
      role: "Admin",
      departmentId: itDept ? itDept.id : undefined,
      passwordHash,
      mustChangePassword: true, // إجبار تغيير كلمة المرور عند أول دخول
      isActive: true,
      isApproved: true,
      canViewAllTickets: true,
      canEditAnyTicket: true,
      canReassignTickets: true,
    },
  });

  await prisma.activityEntry.create({
    data: {
      userId: admin.id,
      userName: admin.fullName,
      action: "إعادة تهيئة النظام وإنشاء حساب المسؤول الأول",
    },
  });

  console.log("انتهت إعادة التهيئة بنجاح.");
  console.log(`مسؤول النظام: ${admin.email} (ID: ${admin.id})`);
  console.log("يجب تغيير كلمة المرور عند أول دخول (mustChangePassword = true).");
  console.log("ملاحظة: لا تُسجّل كلمة المرور في مستودع الكود.");
}

main()
  .catch((e) => {
    console.error("فشل إعادة التهيئة:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });