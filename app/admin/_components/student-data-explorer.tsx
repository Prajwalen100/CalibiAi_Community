"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  Download,
  Filter,
  Gauge,
  Globe2,
  Mail,
  Phone,
  RotateCcw,
  Search,
  Trophy,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import {
  STUDENT_CSV_COLUMNS,
  filterStudents,
  type StudentActivity,
  type StudentDataset,
  type StudentRecord,
} from "@/lib/admin/students";
import { toCsv, csvFileName } from "@/lib/admin/csv";
import { EmptyState, Panel, Pill, StatCard, formatDate } from "./ui";

type SortKey = "name" | "score" | "college" | "country" | "lastActive" | "joined";

export function StudentDataExplorer({ dataset }: { dataset: StudentDataset }) {
  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState<StudentActivity | "all">("all");
  const [college, setCollege] = useState("all");
  const [country, setCountry] = useState("all");
  const [role, setRole] = useState("all");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastActive");
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const rows = filterStudents(dataset.students, {
      search,
      activity,
      college,
      country,
      role,
      minScore: minScore === "" ? undefined : Number(minScore),
      maxScore: maxScore === "" ? undefined : Number(maxScore),
    });

    const direction = sortAsc ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.fullName.localeCompare(b.fullName) * direction;
        case "score":
          return (a.scoreTotal - b.scoreTotal) * direction;
        case "college":
          return (a.college ?? "").localeCompare(b.college ?? "") * direction;
        case "country":
          return (a.country ?? "").localeCompare(b.country ?? "") * direction;
        case "joined":
          return (new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()) * direction;
        case "lastActive":
        default:
          return (new Date(a.lastActiveAt ?? 0).getTime() - new Date(b.lastActiveAt ?? 0).getTime()) * direction;
      }
    });
  }, [dataset.students, search, activity, college, country, role, minScore, maxScore, sortKey, sortAsc]);

  const selectedRows = filtered.filter((student) => selected.has(student.userId));
  const exportRows = selectedRows.length > 0 ? selectedRows : filtered;
  const allVisibleSelected = filtered.length > 0 && filtered.every((student) => selected.has(student.userId));

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((current) => !current);
      return;
    }
    setSortKey(key);
    setSortAsc(key === "name" || key === "college" || key === "country");
  }

  function toggleAll() {
    setSelected((current) => {
      if (allVisibleSelected) {
        const next = new Set(current);
        filtered.forEach((student) => next.delete(student.userId));
        return next;
      }
      const next = new Set(current);
      filtered.forEach((student) => next.add(student.userId));
      return next;
    });
  }

  function toggleOne(userId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function resetFilters() {
    setSearch("");
    setActivity("all");
    setCollege("all");
    setCountry("all");
    setRole("all");
    setMinScore("");
    setMaxScore("");
    setSelected(new Set());
    setNotice(null);
  }

  /**
   * Downloads exactly what the operator sees. The rows are already loaded, so
   * the CSV is generated in the browser with the same column contract the
   * server export route uses.
   */
  function downloadCsv() {
    if (exportRows.length === 0) {
      setNotice("There are no rows to export with the current filters.");
      return;
    }
    setDownloading(true);
    try {
      const csv = toCsv(exportRows, STUDENT_CSV_COLUMNS);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = csvFileName("calibiai-students");
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setNotice(`Downloaded ${exportRows.length} student record${exportRows.length === 1 ? "" : "s"} as CSV.`);
    } finally {
      setDownloading(false);
    }
  }

  const serverExportHref = (() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (activity !== "all") params.set("activity", activity);
    if (college !== "all") params.set("college", college);
    if (country !== "all") params.set("country", country);
    if (role !== "all") params.set("role", role);
    if (minScore) params.set("minScore", minScore);
    if (maxScore) params.set("maxScore", maxScore);
    selectedRows.forEach((student) => params.append("id", student.userId));
    const query = params.toString();
    return `/api/admin/students/export${query ? `?${query}` : ""}`;
  })();

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Users} label="Total students" value={dataset.totals.all} detail="Profiles with a login" accent="brand" />
        <StatCard icon={Phone} label="Phone captured" value={dataset.totals.withPhone} detail="Students with phone numbers" accent="emerald" />
        <StatCard icon={UserCheck} label="Active" value={dataset.totals.active} detail="Seen in the last 30 days" accent="emerald" />
        <StatCard icon={UserX} label="Inactive" value={dataset.totals.inactive} detail="No activity in 30 days" accent="amber" />
        <StatCard icon={Trophy} label="Average score" value={dataset.totals.averageScore} detail="CalibiAI Score across learners" accent="violet" />
      </div>

      {dataset.error ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-300/60 bg-amber-50/80 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          <div>
            <p className="font-bold">Student data could not be loaded.</p>
            <p className="mt-0.5">{dataset.error}</p>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-300/60 bg-emerald-50/80 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          <p>{notice}</p>
        </div>
      ) : null}

      <Panel
        title="Filters"
        description="Narrow the list by status, college, country, role, score or free-text search. The export always matches what you see."
        icon={Filter}
        action={
          <button type="button" onClick={resetFilters} className="admin-btn admin-btn-ghost admin-btn-sm">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        }
      >
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <label className="admin-label" htmlFor="student-search">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="student-search"
                className="admin-input pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, phone, college, country…"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="admin-label" htmlFor="student-college">
              College
            </label>
            <select
              id="student-college"
              className="admin-select"
              value={college}
              onChange={(event) => setCollege(event.target.value)}
            >
              <option value="all">All colleges</option>
              {dataset.colleges.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="admin-label" htmlFor="student-country">
              Country
            </label>
            <select
              id="student-country"
              className="admin-select"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            >
              <option value="all">All countries</option>
              {dataset.countries.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="admin-label" htmlFor="student-role">
              Role
            </label>
            <select
              id="student-role"
              className="admin-select"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="all">All roles</option>
              {dataset.roles.map((item) => (
                <option key={item} value={item}>
                  {item.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="admin-label">Score range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                className="admin-input"
                value={minScore}
                onChange={(event) => setMinScore(event.target.value)}
                placeholder="min"
                aria-label="Minimum score"
              />
              <input
                type="number"
                min={0}
                className="admin-input"
                value={maxScore}
                onChange={(event) => setMaxScore(event.target.value)}
                placeholder="max"
                aria-label="Maximum score"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="admin-eyebrow mr-1">Status</span>
          {(
            [
              { value: "all", label: `All (${dataset.totals.all})` },
              { value: "active", label: `Active (${dataset.totals.active})` },
              { value: "inactive", label: `Inactive (${dataset.totals.inactive})` },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setActivity(option.value)}
              className={`admin-btn admin-btn-sm ${activity === option.value ? "admin-btn-primary" : "admin-btn-ghost"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        title={`Students (${filtered.length})`}
        description={
          selectedRows.length > 0
            ? `${selectedRows.length} row${selectedRows.length === 1 ? "" : "s"} selected — only those will be exported.`
            : "No rows selected, so the export includes every filtered student."
        }
        icon={Users}
        action={
          <>
            <a href={serverExportHref} className="admin-btn admin-btn-ghost">
              <Download className="h-4 w-4" /> Server CSV
            </a>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={downloading || exportRows.length === 0}
              className="admin-btn admin-btn-primary"
            >
              <Download className="h-4 w-4" />
              Download CSV ({exportRows.length})
            </button>
          </>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={dataset.students.length === 0 ? "No students yet" : "No students match these filters"}
            description={
              dataset.students.length === 0
                ? "As soon as learners sign in and complete their profile, their name, email, phone, college, country and score appear here."
                : "Adjust the status, college, country, role or score filters to widen the result set."
            }
            action={
              dataset.students.length > 0 ? (
                <button type="button" onClick={resetFilters} className="admin-btn admin-btn-ghost admin-btn-sm">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset filters
                </button>
              ) : null
            }
          />
        ) : (
          <div className="admin-scroll max-h-[640px] overflow-auto rounded-2xl border border-white/70">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      aria-label="Select all visible students"
                    />
                  </th>
                  <SortableHeader label="Name" active={sortKey === "name"} asc={sortAsc} onClick={() => toggleSort("name")} />
                  <th>Email</th>
                  <th>Phone</th>
                  <SortableHeader
                    label="College"
                    active={sortKey === "college"}
                    asc={sortAsc}
                    onClick={() => toggleSort("college")}
                  />
                  <SortableHeader
                    label="Country"
                    active={sortKey === "country"}
                    asc={sortAsc}
                    onClick={() => toggleSort("country")}
                  />
                  <th>Role</th>
                  <SortableHeader label="Score" active={sortKey === "score"} asc={sortAsc} onClick={() => toggleSort("score")} />
                  <th>Status</th>
                  <SortableHeader
                    label="Last active"
                    active={sortKey === "lastActive"}
                    asc={sortAsc}
                    onClick={() => toggleSort("lastActive")}
                  />
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <StudentRow
                    key={student.userId}
                    student={student}
                    selected={selected.has(student.userId)}
                    onToggle={() => toggleOne(student.userId)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs admin-faint">
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> {filtered.filter((s) => s.email).length} with email
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> {filtered.filter((s) => s.phone).length} with phone
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> {new Set(filtered.map((s) => s.college).filter(Boolean)).size} colleges
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Globe2 className="h-3.5 w-3.5" /> {new Set(filtered.map((s) => s.country).filter(Boolean)).size} countries
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5" /> {STUDENT_CSV_COLUMNS.length} columns per CSV row
          </span>
        </div>
      </Panel>
    </div>
  );
}

function SortableHeader({
  label,
  active,
  asc,
  onClick,
}: {
  label: string;
  active: boolean;
  asc: boolean;
  onClick: () => void;
}) {
  return (
    <th>
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 hover:text-slate-900">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active ? "text-sky-600" : "opacity-40"}`} />
        {active ? <span className="sr-only">{asc ? "ascending" : "descending"}</span> : null}
      </button>
    </th>
  );
}

function StudentRow({
  student,
  selected,
  onToggle,
}: {
  student: StudentRecord;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <tr data-selected={selected}>
      <td>
        <input
          type="checkbox"
          className="admin-checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${student.fullName}`}
        />
      </td>
      <td>
        <p className="font-bold admin-title">{student.fullName}</p>
        {student.username ? <p className="admin-mono text-[11px] admin-faint">@{student.username}</p> : null}
      </td>
      <td>
        <p className="truncate">{student.email ?? "—"}</p>
      </td>
      <td className="whitespace-nowrap">
        <p className="font-semibold admin-title">{student.phone ?? "—"}</p>
      </td>
      <td>
        <p className="truncate">{student.college ?? "—"}</p>
        {student.branch ? <p className="text-[11px] admin-faint">{student.branch}</p> : null}
      </td>
      <td className="whitespace-nowrap">{student.country ?? "—"}</td>
      <td className="whitespace-nowrap capitalize">
        {(student.learningRole ?? student.targetRole ?? "—").replace(/_/g, " ")}
      </td>
      <td>
        <span className="font-black admin-title">{student.scoreTotal}</span>
        {student.scoreTier ? <span className="ml-1.5 text-[11px] capitalize admin-faint">{student.scoreTier}</span> : null}
      </td>
      <td>
        {student.activity === "active" ? <Pill tone="ok">Active</Pill> : <Pill tone="neutral">Inactive</Pill>}
      </td>
      <td className="whitespace-nowrap">{formatDate(student.lastActiveAt)}</td>
    </tr>
  );
}
