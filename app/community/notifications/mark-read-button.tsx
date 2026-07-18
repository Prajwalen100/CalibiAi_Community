"use client";

import { markNotificationsRead } from "@/app/community/actions";
import { useRouter } from "next/navigation";

export function MarkAllReadButton() {
  const router = useRouter();

  async function handleClick() {
    await markNotificationsRead();
    router.refresh();
  }

  return (
    <button onClick={handleClick} className="btn-secondary text-sm">
      Mark all as read
    </button>
  );
}
