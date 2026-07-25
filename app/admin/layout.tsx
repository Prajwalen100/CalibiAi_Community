import type { Metadata } from "next";
import "./admin-theme.css";

export const metadata: Metadata = {
  title: "CalibiAI Admin Portal",
  description: "Operate the CalibiAI blog CMS, student data exports and learning-engine content audits.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-scope">
      <div className="admin-aurora" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
