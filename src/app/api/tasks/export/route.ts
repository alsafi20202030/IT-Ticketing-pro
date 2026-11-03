import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAuth(["Admin", "IT"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const isItOrAdmin = user.role === "IT" || user.role === "Admin";
  const { searchParams } = new URL(req.url);

  const userIdFilter = searchParams.get("userId");
  const statusFilter = searchParams.get("status");
  const priorityFilter = searchParams.get("priority");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const format = searchParams.get("format") || "xlsx";

  const where: any = {};

  if (!isItOrAdmin) {
    where.userId = user.id;
  } else if (userIdFilter) {
    where.userId = parseInt(userIdFilter, 10);
  }

  if (statusFilter) where.status = statusFilter;
  if (priorityFilter) where.priority = priorityFilter;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const STATUS_LABELS: Record<string, string> = {
    Pending: "قيد الانتظار",
    Completed: "مكتملة",
  };

  const TYPE_LABELS: Record<string, string> = {
    Meeting: "اجتماع",
    VendorFollowUp: "متابعة مورد",
    RequestHandling: "معالجة طلب",
    Maintenance: "صيانة",
    Other: "أخرى",
  };

  const tasks = await prisma.employeeTask.findMany({
    where,
    include: {
      user: { select: { id: true, fullName: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (format === "csv") {
    const csvHeaders = ["العنوان", "النوع", "الحالة", "الموظف", "تاريخ الإنشاء", "تاريخ الإكمال"];
    const csvRows = tasks.map((t: any) => [
      t.title,
      TYPE_LABELS[t.taskType] || t.taskType,
      STATUS_LABELS[t.status] || t.status,
      t.user?.fullName || "غيرKnown",
      new Date(t.createdAt).toLocaleDateString("ar-SA"),
      t.completedAt ? new Date(t.completedAt).toLocaleDateString("ar-SA") : "",
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row: any[]) => row.map((cell) => `"${String(cell).replace(/"/g, '\\\\"')}"`).join(",")),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("تقرير_المهام_" + new Date().toISOString().split("T")[0] + ".csv")}`,
      },
    });
  }

  // XLSX format
  if (format === "xlsx") {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("تقرير المهام");

      // Add headers
      worksheet.addRow(["العنوان", "النوع", "الحالة", "الموظف", "تاريخ الإنشاء", "تاريخ الإكمال"]);

      // Add task rows
      for (const t of tasks) {
        const completedDate = t.completedAt
          ? new Date(t.completedAt).toLocaleDateString("ar-SA")
          : "";
        worksheet.addRow([
          t.title,
          TYPE_LABELS[t.taskType] || t.taskType,
          STATUS_LABELS[t.status] || t.status,
          t.user?.fullName || "غيرKnown",
          new Date(t.createdAt).toLocaleDateString("ar-SA"),
          completedDate,
        ]);
      }

      // Set column widths
      worksheet.getColumn(1).width = 30;
      worksheet.getColumn(2).width = 25;
      worksheet.getColumn(3).width = 20;
      worksheet.getColumn(4).width = 25;
      worksheet.getColumn(5).width = 20;
      worksheet.getColumn(6).width = 20;

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("تقرير_المهام_" + new Date().toISOString().split("T")[0] + ".xlsx")}`,
        },
      });
    } catch (error: any) {
      console.error("Excel export error:", error);
      return NextResponse.json(
        { message: "فشل تصدير التقرير: " + (error.message || "خطأ غير معروف") },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ message: "تنسيق غير مدعوم، يرجى استخدام csv أو xlsx" }, { status: 400 });
}