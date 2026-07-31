"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [prevOpen, setPrevOpen] = useState(open);
  if (open && !prevOpen) {
    setPrevOpen(true);
    setFormKey((k) => k + 1);
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  // The feed is inside animated containers that use CSS transforms. A fixed
  // element nested there is positioned/clipped by that container instead of
  // the viewport. Rendering the overlay at document.body avoids that and keeps
  // the full form visible above every sidebar and animation.
  return createPortal(
    <div
      // Phones: edge-to-edge bottom sheet. From `sm` up the original centred
      // dialog is preserved exactly.
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 px-0 py-0 backdrop-blur-sm sm:items-center sm:px-4 sm:py-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create a post"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[calc(100dvh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 sm:max-h-[calc(100dvh-4rem)] max-sm:max-h-[92dvh] max-sm:rounded-b-none max-sm:pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-6">
          <h2 className="text-lg font-black text-primary">Create a Post</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 max-sm:inline-flex max-sm:h-10 max-sm:w-10 max-sm:items-center max-sm:justify-center max-sm:p-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Exactly one scroll region. Previously the overlay scrolled and this
            div also had its own max-height, so the two fought and the bottom of
            a tall form could become unreachable. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-6">
          <CreatePostForm
            key={formKey}
            communities={communities}
            hideBackLink
            onSuccess={onClose}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
