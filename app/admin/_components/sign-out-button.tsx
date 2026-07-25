"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export function AdminSignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } finally {
      router.replace("/admin/signin");
      router.refresh();
    }
  }

  return (
    <button type="button" onClick={signOut} disabled={busy} className="admin-btn admin-btn-ghost admin-btn-sm w-full">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
      Sign out
    </button>
  );
}
