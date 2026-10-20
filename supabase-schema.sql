-- ==============================================================================
-- IT Desk | بوابة طلبات الدعم الفني وتقنية المعلومات
-- كامل هيكل قاعدة البيانات والبيانات الأولية لمنصة Supabase (PostgreSQL)
-- ==============================================================================

-- 1. حذف الجداول القديمة إن وجدت (Clean Reset)
DROP TABLE IF EXISTS "CannedReply" CASCADE;
DROP TABLE IF EXISTS "UserNotification" CASCADE;
DROP TABLE IF EXISTS "AssignmentRule" CASCADE;
DROP TABLE IF EXISTS "TicketDelayReason" CASCADE;
DROP TABLE IF EXISTS "TicketHistory" CASCADE;
DROP TABLE IF EXISTS "TicketComment" CASCADE;
DROP TABLE IF EXISTS "Ticket" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "HelpdeskUser" CASCADE;
DROP TABLE IF EXISTS "Department" CASCADE;
DROP TABLE IF EXISTS "SystemSetting" CASCADE;
DROP TABLE IF EXISTS "ActivityEntry" CASCADE;

-- 2. جدول الأقسام (Department)
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- 3. جدول المستخدمين (HelpdeskUser)
CREATE TABLE "HelpdeskUser" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "titlePrefix" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "userName" TEXT,
    "phoneNumber" TEXT,
    "jobTitle" TEXT,
    "departmentId" INTEGER,
    "role" TEXT NOT NULL DEFAULT 'User',
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "isOnLeave" BOOLEAN NOT NULL DEFAULT false,
    "backupAssigneeId" INTEGER,
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntilUtc" TIMESTAMP(3),
    "canViewAllTickets" BOOLEAN NOT NULL DEFAULT false,
    "canEditAnyTicket" BOOLEAN NOT NULL DEFAULT false,
    "canReassignTickets" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HelpdeskUser_pkey" PRIMARY KEY ("id")
);

-- 4. جدول تصنيفات التذاكر (Category)
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- 5. جدول تذاكر الدعم الفني (Ticket)
CREATE TABLE "Ticket" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'New',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "categoryId" INTEGER NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "assignedToId" INTEGER,
    "attachmentPath" TEXT,
    "rating" INTEGER,
    "ratingComment" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "heldDurationMs" INTEGER NOT NULL DEFAULT 0,
    "holdStartedAt" TIMESTAMP(3),
    "slaWarningSent" BOOLEAN NOT NULL DEFAULT false,
    "slaOverdueSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- 6. جدول التعليقات والردود والملاحظات الداخلية (TicketComment)
CREATE TABLE "TicketComment" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "attachmentPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

-- 7. جدول السجل التاريخي لحركات التذكرة (TicketHistory)
CREATE TABLE "TicketHistory" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "byUserId" INTEGER NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketHistory_pkey" PRIMARY KEY ("id")
);

-- 8. جدول أسباب تعليق التذاكر (TicketDelayReason)
CREATE TABLE "TicketDelayReason" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketDelayReason_pkey" PRIMARY KEY ("id")
);

-- 9. جدول قواعد الإسناد التلقائي للأقسام (AssignmentRule)
CREATE TABLE "AssignmentRule" (
    "id" SERIAL NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "defaultAssigneeId" INTEGER NOT NULL,
    CONSTRAINT "AssignmentRule_pkey" PRIMARY KEY ("id")
);

-- 10. جدول الإشعارات (UserNotification)
CREATE TABLE "UserNotification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "ticketId" INTEGER,
    "text" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- 11. جدول إعدادات النظام والهوية (SystemSetting)
CREATE TABLE "SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- 12. جدول سجل تدقيق العمليات (ActivityEntry)
CREATE TABLE "ActivityEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityEntry_pkey" PRIMARY KEY ("id")
);

-- 13. جدول الردود الجاهزة (CannedReply)
CREATE TABLE "CannedReply" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    CONSTRAINT "CannedReply_pkey" PRIMARY KEY ("id")
);

-- ==============================================================================
-- إنشاء الفهارس والقيود الفريدة (Unique Constraints & Indexes)
-- ==============================================================================
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");
CREATE UNIQUE INDEX "HelpdeskUser_email_key" ON "HelpdeskUser"("email");
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "AssignmentRule_departmentId_key" ON "AssignmentRule"("departmentId");
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- ==============================================================================
-- العلاقات والمفاتيح الخارجية (Foreign Keys)
-- ==============================================================================
ALTER TABLE "HelpdeskUser" ADD CONSTRAINT "HelpdeskUser_departmentId_fkey" 
    FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_categoryId_fkey" 
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_requesterId_fkey" 
    FOREIGN KEY ("requesterId") REFERENCES "HelpdeskUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToId_fkey" 
    FOREIGN KEY ("assignedToId") REFERENCES "HelpdeskUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey" 
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "HelpdeskUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TicketHistory" ADD CONSTRAINT "TicketHistory_ticketId_fkey" 
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TicketHistory" ADD CONSTRAINT "TicketHistory_byUserId_fkey" 
    FOREIGN KEY ("byUserId") REFERENCES "HelpdeskUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TicketDelayReason" ADD CONSTRAINT "TicketDelayReason_ticketId_fkey" 
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TicketDelayReason" ADD CONSTRAINT "TicketDelayReason_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "HelpdeskUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssignmentRule" ADD CONSTRAINT "AssignmentRule_departmentId_fkey" 
    FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssignmentRule" ADD CONSTRAINT "AssignmentRule_defaultAssigneeId_fkey" 
    FOREIGN KEY ("defaultAssigneeId") REFERENCES "HelpdeskUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "HelpdeskUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CannedReply" ADD CONSTRAINT "CannedReply_createdById_fkey" 
    FOREIGN KEY ("createdById") REFERENCES "HelpdeskUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ==============================================================================
-- البيانات الأولية الأساسية (Seed Data)
-- ==============================================================================

-- 1. الأقسام
INSERT INTO "Department" ("name") VALUES
    ('المحاسبة'),
    ('الموارد البشرية'),
    ('المختبر'),
    ('الصيدلية'),
    ('الإدارة'),
    ('تقنية المعلومات')
ON CONFLICT ("name") DO NOTHING;

-- 2. التصنيفات
INSERT INTO "Category" ("name") VALUES
    ('الشبكة'),
    ('الطابعات'),
    ('البرامج'),
    ('الأجهزة'),
    ('البريد الإلكتروني'),
    ('أخرى')
ON CONFLICT ("name") DO NOTHING;

-- 3. إعدادات النظام والهوية البصرية
INSERT INTO "SystemSetting" ("key", "value") VALUES
    ('SystemName', 'IT Desk'),
    ('Subtitle', 'بوابة طلبات الدعم الفني'),
    ('PrimaryColor', '#7A1F3D'),
    ('CompanyName', 'الشركة'),
    ('FooterText', 'بوابة الدعم الداخلي'),
    ('LogoPath', '/logo-placeholder.svg'),
    ('AllowSelfRegistration', 'true'),
    ('RegistrationRequiresApproval', 'false'),
    ('AllowedEmailDomain', ''),
    ('ShowPublicHomePage', 'false'),
    ('PublicDescription', 'بوابة طلبات الدعم الفني وتقنية المعلومات الموحدة'),
    ('SlaUrgentHours', '4'),
    ('SlaHighHours', '24'),
    ('SlaMediumHours', '72'),
    ('SlaLowHours', '72'),
    ('AllowShortPin', 'false'),
    ('AssignmentRulesEnabled', 'true'),
    ('AllowRequesterAssigneeChoice', 'true'),
    ('LoginBackgroundPath', ''),
    ('NavPosition', 'right')
ON CONFLICT ("key") DO NOTHING;

-- 4. الحسابات الافتراضية (كلمة المرور المشتركة: Pass@123)
-- كلمة المرور مشفرة بواسطة Bcrypt: $2a$10$oLllrW4THD0pIk4q8Umc4uH5D/1PFijh.jrhXINilH3aCV5jf/rzO
INSERT INTO "HelpdeskUser" (
    "fullName", "titlePrefix", "email", "userName", "jobTitle", 
    "role", "departmentId", "passwordHash", "mustChangePassword", 
    "isActive", "isApproved", "canViewAllTickets", "canEditAnyTicket", "canReassignTickets"
) VALUES
    -- حساب مدير النظام Admin
    (
        'مدير النظام', 'م.', 'admin@itdesk.local', 'admin', 'مدير الدعم الفني', 
        'Admin', (SELECT "id" FROM "Department" WHERE "name" = 'تقنية المعلومات' LIMIT 1), 
        '$2a$10$oLllrW4THD0pIk4q8Umc4uH5D/1PFijh.jrhXINilH3aCV5jf/rzO', false, 
        true, true, true, true, true
    ),
    -- حساب أخصائي الدعم الفني IT
    (
        'أخصائي الدعم الفني', 'أ.', 'tech@itdesk.local', 'tech', 'أخصائي دعم فني', 
        'IT', (SELECT "id" FROM "Department" WHERE "name" = 'تقنية المعلومات' LIMIT 1), 
        '$2a$10$oLllrW4THD0pIk4q8Umc4uH5D/1PFijh.jrhXINilH3aCV5jf/rzO', false, 
        true, true, true, true, true
    ),
    -- حساب مستخدم عادي User
    (
        'سارة أحمد', 'أ.', 'user@itdesk.local', 'sara', 'أخصائي موارد بشرية', 
        'User', (SELECT "id" FROM "Department" WHERE "name" = 'الموارد البشرية' LIMIT 1), 
        '$2a$10$oLllrW4THD0pIk4q8Umc4uH5D/1PFijh.jrhXINilH3aCV5jf/rzO', false, 
        true, true, false, false, false
    )
ON CONFLICT ("email") DO NOTHING;

-- 5. سجل العمليات الأولي
INSERT INTO "ActivityEntry" ("userName", "action") VALUES
    ('مدير النظام', 'تهيئة قاعدة البيانات في Supabase وتثبيت الإعدادات والحسابات الافتراضية');
