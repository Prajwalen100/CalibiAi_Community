"use client";

import { useState } from "react";
import { motion, type Variants } from "motion/react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export interface Avatar {
  id: number;
  svg: React.ReactNode;
  alt: string;
}

export const avatars: Avatar[] = [
  {
    id: 1,
    alt: "Avatar 1",
    svg: (
      <svg
        viewBox="0 0 36 36"
        fill="none"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        aria-label="Avatar 1"
      >
        <mask
          id="avatar-mask-1"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="36"
          height="36"
        >
          <rect width="36" height="36" rx="72" fill="#FFFFFF" />
        </mask>
        <g mask="url(#avatar-mask-1)">
          <rect width="36" height="36" fill="#ff005b" />
          <rect
            x="0"
            y="0"
            width="36"
            height="36"
            transform="translate(9 -5) rotate(219 18 18) scale(1)"
            fill="#ffb238"
            rx="6"
          />
          <g transform="translate(4.5 -4) rotate(9 18 18)">
            <path
              d="M15 19c2 1 4 1 6 0"
              stroke="#000000"
              fill="none"
              strokeLinecap="round"
            />
            <rect x="10" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000" />
            <rect x="24" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000" />
          </g>
        </g>
      </svg>
    ),
  },
  {
    id: 2,
    alt: "Avatar 2",
    svg: (
      <svg
        viewBox="0 0 36 36"
        fill="none"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        aria-label="Avatar 2"
      >
        <mask
          id="avatar-mask-2"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="36"
          height="36"
        >
          <rect width="36" height="36" rx="72" fill="#FFFFFF" />
        </mask>
        <g mask="url(#avatar-mask-2)">
          <rect width="36" height="36" fill="#ff7d10" />
          <rect
            x="0"
            y="0"
            width="36"
            height="36"
            transform="translate(5 -1) rotate(55 18 18) scale(1.1)"
            fill="#0a0310"
            rx="6"
          />
          <g transform="translate(7 -6) rotate(-5 18 18)">
            <path
              d="M15 20c2 1 4 1 6 0"
              stroke="#FFFFFF"
              fill="none"
              strokeLinecap="round"
            />
            <rect x="14" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF" />
            <rect x="20" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF" />
          </g>
        </g>
      </svg>
    ),
  },
  {
    id: 3,
    alt: "Avatar 3",
    svg: (
      <svg
        viewBox="0 0 36 36"
        fill="none"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        aria-label="Avatar 3"
      >
        <mask
          id="avatar-mask-3"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="36"
          height="36"
        >
          <rect width="36" height="36" rx="72" fill="#FFFFFF" />
        </mask>
        <g mask="url(#avatar-mask-3)">
          <rect width="36" height="36" fill="#0a0310" />
          <rect
            x="0"
            y="0"
            width="36"
            height="36"
            transform="translate(-3 7) rotate(227 18 18) scale(1.2)"
            fill="#ff005b"
            rx="36"
          />
          <g transform="translate(-3 3.5) rotate(7 18 18)">
            <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF" />
            <rect x="12" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF" />
            <rect x="22" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF" />
          </g>
        </g>
      </svg>
    ),
  },
  {
    id: 4,
    alt: "Avatar 4",
    svg: (
      <svg
        viewBox="0 0 36 36"
        fill="none"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        aria-label="Avatar 4"
      >
        <mask
          id="avatar-mask-4"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="36"
          height="36"
        >
          <rect width="36" height="36" rx="72" fill="#FFFFFF" />
        </mask>
        <g mask="url(#avatar-mask-4)">
          <rect width="36" height="36" fill="#d8fcb3" />
          <rect
            x="0"
            y="0"
            width="36"
            height="36"
            transform="translate(9 -5) rotate(219 18 18) scale(1)"
            fill="#89fcb3"
            rx="6"
          />
          <g transform="translate(4.5 -4) rotate(9 18 18)">
            <path
              d="M15 19c2 1 4 1 6 0"
              stroke="#000000"
              fill="none"
              strokeLinecap="round"
            />
            <rect x="10" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000" />
            <rect x="24" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000" />
          </g>
        </g>
      </svg>
    ),
  },
];

/** Lookup helper so other components can render the currently-chosen avatar. */
export function getAvatarById(id: number | null | undefined): Avatar {
  if (!id) return avatars[0];
  return avatars.find((a) => a.id === id) ?? avatars[0];
}

// ── Animation variants ──────────────────────────────────────────
const mainAvatarVariants: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
  exit: { y: -20, opacity: 0, transition: { duration: 0.2 } },
};

const pickerContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const pickerItemVariants: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

const selectedVariants: Variants = {
  initial: { opacity: 0, rotate: -180 },
  animate: {
    opacity: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 200, damping: 15 },
  },
  exit: { opacity: 0, rotate: 180, transition: { duration: 0.2 } },
};

// ── Props ──────────────────────────────────────────────────────
export interface AvatarPickerProps {
  /** Displayed name above the avatar grid. Defaults to "Me". */
  displayName?: string;
  /** Sub-label under the display name. */
  hint?: string;
  /** Preselected avatar id (1–4). Defaults to 1. */
  defaultAvatarId?: number;
  /** Fired whenever the user chooses a new avatar. */
  onSelect?: (avatar: Avatar) => void;
  /** Optional extra classes on the outer wrapper. */
  className?: string;
}

export function AvatarPicker({
  displayName = "Me",
  hint = "Select your avatar",
  defaultAvatarId,
  onSelect,
  className,
}: AvatarPickerProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar>(
    getAvatarById(defaultAvatarId),
  );
  const [rotationCount, setRotationCount] = useState(0);

  const handleAvatarSelect = (avatar: Avatar) => {
    setRotationCount((prev) => prev + 1080); // three full rotations
    setSelectedAvatar(avatar);
    onSelect?.(avatar);
  };

  return (
    <motion.div initial="initial" animate="animate" className={cn("w-full", className)}>
      <Card className="w-full max-w-md mx-auto overflow-hidden bg-gradient-to-b from-background to-muted/30">
        <CardContent className="p-0">
          {/* Background header */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: "8rem",
              transition: {
                height: { type: "spring", stiffness: 100, damping: 20 },
              },
            }}
            className="bg-gradient-to-r from-primary/20 to-primary/10 w-full"
          />

          <div className="px-8 pb-8 -mt-16">
            {/* Main avatar display */}
            <motion.div
              className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 bg-background flex items-center justify-center"
              variants={mainAvatarVariants}
              layoutId="selectedAvatar"
            >
              <motion.div
                className="w-full h-full flex items-center justify-center scale-[3]"
                animate={{ rotate: rotationCount }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              >
                {selectedAvatar.svg}
              </motion.div>
            </motion.div>

            {/* Username display */}
            <motion.div className="text-center mt-4" variants={pickerItemVariants}>
              <motion.h2
                className="text-2xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {displayName}
              </motion.h2>
              <motion.p
                className="text-muted-foreground text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {hint}
              </motion.p>
            </motion.div>

            {/* Avatar selection */}
            <motion.div className="mt-6" variants={pickerContainerVariants}>
              <motion.div
                className="flex justify-center gap-4"
                variants={pickerContainerVariants}
              >
                {avatars.map((avatar) => (
                  <motion.button
                    key={avatar.id}
                    type="button"
                    onClick={() => handleAvatarSelect(avatar)}
                    className={cn(
                      "relative w-12 h-12 rounded-full overflow-hidden border-2",
                      "transition-all duration-300",
                    )}
                    variants={pickerItemVariants}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    whileTap={{ y: 0, transition: { duration: 0.2 } }}
                    aria-label={`Select ${avatar.alt}`}
                    aria-pressed={selectedAvatar.id === avatar.id}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      {avatar.svg}
                    </div>
                    {selectedAvatar.id === avatar.id && (
                      <motion.div
                        className="absolute inset-0 bg-primary/20 ring-2 ring-primary ring-offset-2 ring-offset-background rounded-full"
                        variants={selectedVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        layoutId="selectedIndicator"
                      />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
