import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { csvFileName, toCsv } from "@/lib/admin/csv";
import {
  DEFAULT_ACTIVE_WINDOW_DAYS,
  STUDENT_CSV_COLUMNS,
  filterStudents,
  getStudentDataset,
  type StudentActivity,
} from "@/lib/admin/students";

export const dynamic = "force-dynamic";

function parseActivity(value: string | null): StudentActivity | "all" {
  return value === "active" || value === "inactive" ? value : "all";
}

function parseNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in at /admin/signin to export student data." } },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const activeWithinDays = parseNumber(url.searchParams.get("activeWithinDays")) ?? DEFAULT_ACTIVE_WINDOW_DAYS;
  const dataset = await getStudentDataset({ activeWithinDays });

  if (dataset.error) {
    return NextResponse.json({ error: { code: "STORE", message: dataset.error } }, { status: 503 });
  }

  const selectedIds = url.searchParams.getAll("id");
  const filtered = filterStudents(dataset.students, {
    search: url.searchParams.get("search") ?? undefined,
    activity: parseActivity(url.searchParams.get("activity")),
    college: url.searchParams.get("college") ?? undefined,
    role: url.searchParams.get("role") ?? undefined,
    minScore: parseNumber(url.searchParams.get("minScore")),
    maxScore: parseNumber(url.searchParams.get("maxScore")),
  });

  const rows =
    selectedIds.length > 0 ? filtered.filter((student) => selectedIds.includes(student.userId)) : filtered;

  const requestedColumns = url.searchParams.getAll("column");
  const columns =
    requestedColumns.length > 0
      ? STUDENT_CSV_COLUMNS.filter((column) => requestedColumns.includes(column.key))
      : STUDENT_CSV_COLUMNS;

  const csv = toCsv(rows, columns.length > 0 ? columns : STUDENT_CSV_COLUMNS);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFileName("calibiai-students")}"`,
      "Cache-Control": "no-store",
    },
  });
}
