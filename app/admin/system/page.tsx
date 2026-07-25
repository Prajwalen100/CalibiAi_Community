import { Code2, Database, Lock, ShieldCheck, Trophy } from "lucide-react";
import { requireAdmin } from "../_lib/guard";
import { AdminShell } from "../_components/admin-shell";
import { InfoCard, Meter, Panel, StatCard, StatusPill } from "../_components/ui";
import { TALENT_SCORE_COMPONENTS, getLearningEngineAdminData } from "../_lib/learning-engine-admin-data";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  const session = await requireAdmin("/admin/system");
  const data = await getLearningEngineAdminData();
  const apiPresent = data.repositoryStatus.apiRoutes.filter((route) => route.present).length;
  const tablePresent = data.repositoryStatus.databaseTables.filter((table) => table.present).length;

  return (
    <AdminShell
      active="system"
      eyebrow="System map"
      title="APIs, tables and scoring contracts"
      description="A read-only inspection of the endpoints, Supabase tables and deterministic scoring rules the platform depends on."
      adminEmail={session.email}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Code2}
          label="API files detected"
          value={`${apiPresent}/${data.repositoryStatus.apiRoutes.length}`}
          detail="Compared to the endpoint catalog"
          accent="brand"
        />
        <StatCard
          icon={Database}
          label="Tables referenced"
          value={`${tablePresent}/${data.repositoryStatus.databaseTables.length}`}
          detail={`${data.repositoryStatus.migrationsCount} SQL migrations scanned`}
          accent="violet"
        />
        <StatCard icon={Trophy} label="Talent Score max" value="1000" detail="Deterministic, append-versioned" accent="emerald" />
        <StatCard icon={ShieldCheck} label="Security model" value="RLS" detail="Service role only for admin jobs" accent="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="API endpoint catalog" description="Route presence in this repository." icon={Code2}>
          <div className="admin-scroll max-h-[440px] overflow-auto rounded-2xl border border-white/70">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Owner</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.repositoryStatus.apiRoutes.map((route) => (
                  <tr key={`${route.method}-${route.path}`}>
                    <td>
                      <span className="admin-mono rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] font-bold text-sky-700">
                        {route.method}
                      </span>
                    </td>
                    <td className="admin-mono text-[11px]">{route.path}</td>
                    <td>{route.owner}</td>
                    <td>
                      <StatusPill status={route.status} label={route.present ? "present" : "pending"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Supabase table map" description="Detected by scanning migration SQL text." icon={Database}>
          <div className="admin-scroll grid max-h-[440px] gap-2.5 overflow-auto pr-1 sm:grid-cols-2">
            {data.repositoryStatus.databaseTables.map((table) => (
              <div key={table.table} className="admin-glass-soft flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="admin-mono truncate text-xs font-bold admin-title">{table.table}</p>
                  <p className="text-[11px] admin-faint">{table.owner}</p>
                </div>
                <StatusPill status={table.status} label={table.present ? "seen" : "pending"} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Talent Score configuration"
        description="Scoring is deterministic; AI may only suggest how to improve it."
        icon={Trophy}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {TALENT_SCORE_COMPONENTS.map((component) => (
            <div key={component.component} className="admin-glass-soft p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-black admin-title">{component.component}</h3>
                <span className="admin-pill admin-pill-ok">{component.points}</span>
              </div>
              <div className="mt-3">
                <Meter value={component.points} total={220} />
              </div>
              <p className="mt-3 text-xs leading-5 admin-muted">{component.formula}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Operational invariants" description="Guardrails this admin build respects." icon={Lock}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoCard
            title="Separate admin session"
            detail="The portal signs in at /admin/signin with its own signed cookie, independent of student and employer auth."
          />
          <InfoCard
            title="Server-side writes only"
            detail="Blog creation and student export run through /api/admin routes that verify the admin session first."
          />
          <InfoCard
            title="No client user_id trust"
            detail="Student rows come from the service-role client on the server; the browser never selects arbitrary profiles."
          />
          <InfoCard
            title="Export mirrors filters"
            detail="The CSV always contains exactly the filtered (or selected) rows shown in the table."
          />
          <InfoCard
            title="Formula-injection safe CSV"
            detail="Cells beginning with =, +, - or @ are quoted so spreadsheets do not evaluate exported content."
          />
          <InfoCard
            title="Learner flows untouched"
            detail="Community, LMS, employer and marketing routes are not modified by this portal."
          />
        </div>
      </Panel>
    </AdminShell>
  );
}
