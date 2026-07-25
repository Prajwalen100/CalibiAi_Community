import { requireAdmin } from "../_lib/guard";
import { AdminShell } from "../_components/admin-shell";
import { StudentDataExplorer } from "../_components/student-data-explorer";
import { getStudentDataset } from "@/lib/admin/students";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const session = await requireAdmin("/admin/students");
  const dataset = await getStudentDataset();

  return (
    <AdminShell
      active="students"
      eyebrow="Learner operations"
      title="Student data & CSV export"
      description="Every student who logs in appears here with name, email, phone, college and score. Filter the list, then download the result as a CSV file."
      adminEmail={session.email}
    >
      <StudentDataExplorer dataset={dataset} />
    </AdminShell>
  );
}
