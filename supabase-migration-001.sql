-- IT Desk Migration 001: Ticket conversation + Employee tasks + unified statuses
-- Safe/idempotent: only additive, no data deletion.

-- 1) Normalize existing OnHold tickets to the new unified status "WaitingEmployee"
UPDATE "Ticket" SET "status" = 'WaitingEmployee' WHERE "status" = 'OnHold';

-- 2) Create conversation table
CREATE TABLE IF NOT EXISTS "TicketMessage" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "isFromRequester" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TicketMessage_ticketId_createdAt_idx" ON "TicketMessage"("ticketId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "HelpdeskUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Create employee daily tasks table
CREATE TABLE IF NOT EXISTS "EmployeeTask" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "taskType" TEXT NOT NULL DEFAULT 'Other',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "workDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmployeeTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EmployeeTask_userId_workDate_idx" ON "EmployeeTask"("userId", "workDate");
CREATE INDEX IF NOT EXISTS "EmployeeTask_userId_status_idx" ON "EmployeeTask"("userId", "status");

DO $$ BEGIN
  ALTER TABLE "EmployeeTask" ADD CONSTRAINT "EmployeeTask_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "HelpdeskUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) Extra settings for branding
INSERT INTO "SystemSetting" ("key","value") VALUES ('AccentColor','#DF4366') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "SystemSetting" ("key","value") VALUES ('PortalTitle','بوابة طلبات الدعم الفني') ON CONFLICT ("key") DO NOTHING;
