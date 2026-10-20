const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting IT Desk database seeding...');

  // 1. Departments
  const departments = ['المحاسبة', 'الموارد البشرية', 'المختبر', 'الصيدلية', 'الإدارة', 'تقنية المعلومات'];
  for (const name of departments) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Departments seeded.');

  // 2. Categories
  const categories = ['الشبكة', 'الطابعات', 'البرامج', 'الأجهزة', 'البريد الإلكتروني', 'أخرى'];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Categories seeded.');

  // 3. Settings
  const defaultSettings = [
    { key: 'SystemName', value: 'IT Desk' },
    { key: 'Subtitle', value: 'بوابة طلبات الدعم الفني' },
    { key: 'PrimaryColor', value: '#7A1F3D' },
    { key: 'CompanyName', value: 'الشركة' },
    { key: 'FooterText', value: 'بوابة الدعم الداخلي' },
    { key: 'LogoPath', value: '/logo-placeholder.svg' },
    { key: 'AllowSelfRegistration', value: 'true' },
    { key: 'RegistrationRequiresApproval', value: 'false' },
    { key: 'AllowedEmailDomain', value: '' },
    { key: 'ShowPublicHomePage', value: 'false' },
    { key: 'PublicDescription', value: 'بوابة طلبات الدعم الفني وتقنية المعلومات الموحدة' },
    { key: 'SlaUrgentHours', value: '4' },
    { key: 'SlaHighHours', value: '24' },
    { key: 'SlaMediumHours', value: '72' },
    { key: 'SlaLowHours', value: '72' },
    { key: 'AllowShortPin', value: 'false' },
    { key: 'AssignmentRulesEnabled', value: 'true' },
    { key: 'AllowRequesterAssigneeChoice', value: 'true' },
    { key: 'LoginBackgroundPath', value: '' },
    { key: 'NavPosition', value: 'right' },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log('Settings seeded.');

  // 4. Default Admin User
  const adminEmail = 'admin@itdesk.local';
  const existingAdmin = await prisma.helpdeskUser.findUnique({
    where: { email: adminEmail },
  });

  const itDept = await prisma.department.findUnique({ where: { name: 'تقنية المعلومات' } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Pass@123', 10);
    const admin = await prisma.helpdeskUser.create({
      data: {
        fullName: 'مدير النظام',
        titlePrefix: 'م.',
        email: adminEmail,
        userName: 'admin',
        jobTitle: 'مدير الدعم الفني',
        role: 'Admin',
        departmentId: itDept ? itDept.id : undefined,
        passwordHash,
        mustChangePassword: false,
        isActive: true,
        isApproved: true,
        canViewAllTickets: true,
        canEditAnyTicket: true,
        canReassignTickets: true,
      },
    });
    console.log(`Default admin created: ${admin.email} (Password: Pass@123)`);

    // Create a demo IT Specialist
    const techEmail = 'tech@itdesk.local';
    const techUser = await prisma.helpdeskUser.create({
      data: {
        fullName: 'أخصائي الدعم الفني',
        titlePrefix: 'أ.',
        email: techEmail,
        userName: 'tech',
        jobTitle: 'أخصائي دعم فني',
        role: 'IT',
        departmentId: itDept ? itDept.id : undefined,
        passwordHash,
        mustChangePassword: false,
        isActive: true,
        isApproved: true,
        canViewAllTickets: true,
        canEditAnyTicket: true,
        canReassignTickets: true,
      },
    });
    console.log(`Demo IT tech created: ${techUser.email} (Password: Pass@123)`);

    // Create a demo Regular User
    const hrDept = await prisma.department.findUnique({ where: { name: 'الموارد البشرية' } });
    const userEmail = 'user@itdesk.local';
    const regUser = await prisma.helpdeskUser.create({
      data: {
        fullName: 'سارة أحمد',
        titlePrefix: 'أ.',
        email: userEmail,
        userName: 'sara',
        jobTitle: 'أخصائي موارد بشرية',
        role: 'User',
        departmentId: hrDept ? hrDept.id : undefined,
        passwordHash,
        mustChangePassword: false,
        isActive: true,
        isApproved: true,
      },
    });
    console.log(`Demo regular user created: ${regUser.email} (Password: Pass@123)`);

    // Add initial Activity Log
    await prisma.activityEntry.create({
      data: {
        userId: admin.id,
        userName: admin.fullName,
        action: 'تهيئة النظام وقاعدة البيانات وتجهيز الحسابات الافتراضية',
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
