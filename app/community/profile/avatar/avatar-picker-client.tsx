"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AvatarPicker, type Avatar } from "@/components/ui/avatar-picker";
import { saveProfileAvatar } from "./actions";

interface Props {
  displayName: string;
  initialAvatarId: number;
}

export function AvatarPickerClient({ displayName, initialAvatarId }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(initialAvatarId);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  function handleSelect(avatar: Avatar) {
    setSelectedId(avatar.id);
    setMessage(null);
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("avatar_id", String(selectedId));
      const result = await saveProfileAvatar(fd);
      if ("error" in result) {
        setMessage({ tone: "error", text: result.error ?? "Unable to save avatar." });
        return;
      }
      setMessage({ tone: "success", text: "Avatar saved! It will show up across the community." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <AvatarPicker
        displayName={displayName}
        hint="Tap an avatar to preview, then save your choice"
        defaultAvatarId={initialAvatarId}
        onSelect={handleSelect}
      />

      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="btn-primary inline-flex w-full items-center justify-center gap-2 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" /> Save avatar
            </>
          )}
        </button>
        {message && (
          <p
            role="status"
            className={`w-full rounded-2xl border p-3 text-center text-sm ${
              message.tone === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
