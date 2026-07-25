import type { LucideIcon } from "lucide-react";
import { Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { HealthTone } from "../_lib/learning-engine-admin-data";

const toneClass: Record<HealthTone, string> = {
  ok: "admin-pill-ok",
  warn: "admin-pill-warn",
  danger: "admin-pill-danger",
  info: "admin-pill-info",
};

const toneIcon: Record<HealthTone, LucideIcon> = {
  ok: CheckCircle2,
  warn: AlertTriangle,
  danger: XCircle,
  info: Activity,
};

export function Pill({
  tone = "neutral",
  children,
  icon: Icon,
}: {
  tone?: HealthTone | "neutral";
  children: React.ReactNode;
  icon?: LucideIcon;
}) {
  const className = tone === "neutral" ? "admin-pill-neutral" : toneClass[tone];
  return (
    <span className={`admin-pill ${className}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}

export function StatusPill({ status, label }: { status: HealthTone; label: string }) {
  return (
    <Pill tone={status} icon={toneIcon[status]}>
      {label}
    </Pill>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  accent = "brand",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail?: string;
  accent?: "brand" | "violet" | "emerald" | "amber" | "rose";
}) {
  const accents: Record<string, string> = {
    brand: "from-sky-400/25 to-blue-500/10 text-sky-700",
    violet: "from-violet-400/25 to-fuchsia-500/10 text-violet-700",
    emerald: "from-emerald-400/25 to-teal-500/10 text-emerald-700",
    amber: "from-amber-400/25 to-orange-500/10 text-amber-700",
    rose: "from-rose-400/25 to-pink-500/10 text-rose-700",
  };

  return (
    <div className="admin-glass group p-5 transition-transform duration-300 hover:-translate-y-0.5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accents[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold admin-faint">{label}</p>
      <p className="mt-0.5 text-3xl font-black admin-title">{value}</p>
      {detail ? <p className="mt-1.5 text-xs leading-5 admin-muted">{detail}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  icon: Icon,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`admin-glass p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            {Icon ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-sky-600 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
            ) : null}
            <div>
              {title ? <h2 className="text-lg font-black admin-title">{title}</h2> : null}
              {description ? <p className="mt-1 max-w-3xl text-sm leading-6 admin-muted">{description}</p> : null}
            </div>
          </div>
          {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function MiniStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="admin-glass-soft p-3 text-center">
      <p className="text-lg font-black admin-title">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] admin-faint">{label}</p>
    </div>
  );
}

export function Meter({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
  return (
    <div className="admin-meter">
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ProgressLine({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold admin-muted">{label}</span>
        <span className="font-black admin-title">{value}</span>
      </div>
      <div className="mt-1.5">
        <Meter value={value} total={total} />
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-glass-soft flex flex-col items-center gap-3 border-dashed p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-sky-600 shadow-sm">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="font-black admin-title">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 admin-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function FilePath({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-glass-soft p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] admin-faint">{label}</p>
      <p className="admin-mono mt-1 break-all text-xs admin-muted">{value}</p>
    </div>
  );
}

export function InfoCard({ title, detail, icon: Icon }: { title: string; detail: string; icon?: LucideIcon }) {
  return (
    <div className="admin-glass-soft p-4">
      {Icon ? (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/85 text-emerald-600 shadow-sm">
          <Icon className="h-4.5 w-4.5" />
        </div>
      ) : null}
      <h3 className={`font-black admin-title ${Icon ? "mt-3" : ""}`}>{title}</h3>
      <p className="mt-1.5 text-sm leading-6 admin-muted">{detail}</p>
    </div>
  );
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}
