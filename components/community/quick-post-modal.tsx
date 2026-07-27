"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CreatePostForm } from "@/app/community/create/create-form";

type Props = {
  open: boolean;
  onClose: () => void;
  communities: Array<{ id: string; name: string; emoji: string; slug: string }>;
};

/**
 * Full create-post form rendered inside a modal so users can post directly
 * from the feed's "Share your AI workflow…" composer instead of navigating
 * away to /community/create.
 */
export function QuickPostModal({ open, onClose, communities }: Props) {
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    // Reset the form each time the modal is opened fresh.
    setFormKey((k) => k + 1);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create a post"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-black text-primary">Create a Post</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 pb-6">
          <CreatePostForm
            key={formKey}
            communities={communities}
            hideBackLink
            onSuccess={onClose}
          />
        </div>
      </div>
    </div>
  );
}
