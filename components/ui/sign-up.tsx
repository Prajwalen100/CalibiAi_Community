"use client";

import { cn } from "@/lib/utils";
import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback,
  createContext,
  Children,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  ArrowRight,
  Mail,
  Gem,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  X,
  AlertCircle,
  PartyPopper,
  Loader,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useInView,
  type Variants,
  type Transition,
} from "framer-motion";
import type {
  GlobalOptions as ConfettiGlobalOptions,
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
} from "canvas-confetti";
import confetti from "canvas-confetti";

// ── CONFETTI ───────────────────────────────────────────────────
type Api = { fire: (options?: ConfettiOptions) => void };
export type ConfettiRef = Api | null;

const ConfettiContext = createContext<Api>({} as Api);

const Confetti = forwardRef<
  ConfettiRef,
  React.ComponentPropsWithRef<"canvas"> & {
    options?: ConfettiOptions;
    globalOptions?: ConfettiGlobalOptions;
    manualstart?: boolean;
  }
>((props, ref) => {
  const {
    options,
    globalOptions = { resize: true, useWorker: true },
    manualstart = false,
    ...rest
  } = props;
  const instanceRef = useRef<ConfettiInstance | null>(null);

  const canvasRef = useCallback(
    (node: HTMLCanvasElement) => {
      if (node !== null) {
        if (instanceRef.current) return;
        instanceRef.current = confetti.create(node, { ...globalOptions, resize: true });
      } else if (instanceRef.current) {
        instanceRef.current.reset();
        instanceRef.current = null;
      }
    },
    [globalOptions],
  );

  const fire = useCallback(
    (opts: ConfettiOptions = {}) => instanceRef.current?.({ ...options, ...opts }),
    [options],
  );
  const api = useMemo(() => ({ fire }), [fire]);
  useImperativeHandle(ref, () => api, [api]);
  useEffect(() => {
    if (!manualstart) fire();
  }, [manualstart, fire]);

  return <canvas ref={canvasRef} {...rest} />;
});
Confetti.displayName = "Confetti";

// ── TEXT LOOP ──────────────────────────────────────────────────
type TextLoopProps = {
  children: React.ReactNode[];
  className?: string;
  interval?: number;
  transition?: Transition;
  variants?: Variants;
  onIndexChange?: (index: number) => void;
  stopOnEnd?: boolean;
};

export function TextLoop({
  children,
  className,
  interval = 2,
  transition = { duration: 0.3 },
  variants,
  onIndexChange,
  stopOnEnd = false,
}: TextLoopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Children.toArray(children);

  useEffect(() => {
    const intervalMs = interval * 1000;
    const timer = setInterval(() => {
      setCurrentIndex((current) => {
        if (stopOnEnd && current === items.length - 1) {
          clearInterval(timer);
          return current;
        }
        const next = (current + 1) % items.length;
        onIndexChange?.(next);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, interval, onIndexChange, stopOnEnd]);

  const motionVariants: Variants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  };

  return (
    <div className={cn("relative inline-block whitespace-nowrap", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentIndex}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
          variants={variants || motionVariants}
        >
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── BLUR FADE ───────────────────────────────────────────────────
interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  variant?: { hidden: { y: number }; visible: { y: number } };
  duration?: number;
  delay?: number;
  yOffset?: number;
  inView?: boolean;
  inViewMargin?: string;
  blur?: string;
}

function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  inView = true,
  inViewMargin = "-50px",
  blur = "6px",
}: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin as `${number}px` });
  const isInView = !inView || inViewResult;

  const defaultVariants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: -yOffset, opacity: 1, filter: `blur(0px)` },
  };
  const combinedVariants = variant || defaultVariants;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      exit="hidden"
      variants={combinedVariants}
      transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── GLASS BUTTON (using globals.css classes) ────────────────────
export interface GlassButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size">,
  VariantProps<typeof cva> {
  contentClassName?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size = "default", contentClassName, onClick, ...props }, ref) => {
    const sizeClasses = {
      default: "px-6 py-3.5 text-sm",
      sm: "px-4 py-2 text-xs",
      lg: "px-8 py-4 text-base",
      icon: "h-10 w-10",
    };

    const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const button = e.currentTarget.querySelector("button");
      if (button && e.target !== button) button.click();
    };

    return (
      <div
        className={cn("inline-flex", className)}
        onClick={handleWrapperClick}
      >
        <button
          ref={ref}
          onClick={onClick}
          className={cn(
            "btn-primary",
            size === "icon" && "p-0",
            size === "sm" && "px-4 py-2 text-xs",
            size === "lg" && "px-8 py-4 text-base",
            contentClassName
          )}
          {...props}
        >
          <span className="flex items-center justify-center gap-2">{children}</span>
        </button>
      </div>
    );
  },
);
GlassButton.displayName = "GlassButton";

// ── ANIMATED GRADIENT BACKGROUND ───────────────────────────────
const gradientKeyframes = `
@keyframes float1 { 0% { transform: translate(0, 0); } 50% { transform: translate(-10px, 10px); } 100% { transform: translate(0, 0); } }
@keyframes float2 { 0% { transform: translate(0, 0); } 50% { transform: translate(10px, -10px); } 100% { transform: translate(0, 0); } }
`;

const GradientBackground = () => (
  <>
    <style>{gradientKeyframes}</style>
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      className="absolute top-0 left-0 w-full h-full"
    >
      <defs>
        <linearGradient id="rev_grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
          <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0.6} />
        </linearGradient>
        <linearGradient id="rev_grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--chart-4))" stopOpacity={0.9} />
          <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity={0.7} />
          <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.6} />
        </linearGradient>
        <radialGradient id="rev_grad3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
          <stop offset="100%" stopColor="hsl(var(--chart-5))" stopOpacity={0.4} />
        </radialGradient>
        <filter id="rev_blur1" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="35" />
        </filter>
        <filter id="rev_blur2" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="25" />
        </filter>
        <filter id="rev_blur3" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="45" />
        </filter>
      </defs>
      <g style={{ animation: "float1 20s ease-in-out infinite" }}>
        <ellipse cx="200" cy="500" rx="250" ry="180" fill="url(#rev_grad1)" filter="url(#rev_blur1)" transform="rotate(-30 200 500)" />
        <rect x="500" y="100" width="300" height="250" rx="80" fill="url(#rev_grad2)" filter="url(#rev_blur2)" transform="rotate(15 650 225)" />
      </g>
      <g style={{ animation: "float2 25s ease-in-out infinite" }}>
        <circle cx="650" cy="450" r="150" fill="url(#rev_grad3)" filter="url(#rev_blur3)" opacity="0.7" />
        <ellipse cx="50" cy="150" rx="180" ry="120" fill="hsl(var(--accent))" filter="url(#rev_blur2)" opacity="0.8" />
      </g>
    </svg>
  </>
);

// ── ICONS ──────────────────────────────────────────────────────
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-6 h-6">
    <g fillRule="evenodd" fill="none">
      <g fillRule="nonzero" transform="translate(3, 2)">
        <path fill="#4285F4" d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267" />
        <path fill="#34A853" d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L12.3700541,35.3591501 L3.26524241,42.4054492 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667" />
        <path fill="#FBBC05" d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L12.6667095,23.2715173 L3.44779955,16.1120237 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782" />
        <path fill="#EB4335" d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769" />
      </g>
    </g>
  </svg>
);

const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-6 h-6">
    <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const modalSteps = [
  { message: "Signing you up...", icon: <Loader className="w-12 h-12 text-primary animate-spin" /> },
  { message: "Onboarding you...", icon: <Loader className="w-12 h-12 text-primary animate-spin" /> },
  { message: "Finalizing...", icon: <Loader className="w-12 h-12 text-primary animate-spin" /> },
  { message: "Welcome Aboard!", icon: <PartyPopper className="w-12 h-12 text-green-500" /> },
];

const TEXT_LOOP_INTERVAL = 1.5;

const DefaultLogo = () => (
  <div className="bg-primary text-primary-foreground rounded-md p-1.5">
    <Gem className="h-4 w-4" />
  </div>
);

// ── MAIN COMPONENT ─────────────────────────────────────────────
export type AuthMode = "sign-up" | "sign-in";
export type OAuthProvider = "google" | "github";

export interface AuthComponentProps {
  logo?: React.ReactNode;
  brandName?: string;
  mode?: AuthMode;
  onEmailSubmit?: (input: { email: string; password: string; mode: AuthMode }) => Promise<string | void> | string | void;
  onOAuth?: (provider: OAuthProvider) => void | Promise<void>;
  switchHref?: string;
}

export const AuthComponent = ({
  logo = <DefaultLogo />,
  brandName = "CalibiAI",
  mode = "sign-up",
  onEmailSubmit,
  onOAuth,
  switchHref,
}: AuthComponentProps) => {
  const isSignUp = mode === "sign-up";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authStep, setAuthStep] = useState<"email" | "password" | "confirmPassword">("email");
  const [modalStatus, setModalStatus] = useState<"closed" | "loading" | "error" | "success">("closed");
  const [modalErrorMessage, setModalErrorMessage] = useState("");
  const confettiRef = useRef<ConfettiRef>(null);

  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = password.length >= 6;
  const isConfirmPasswordValid = confirmPassword.length >= 6;

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

  const fireSideCanons = useCallback(() => {
    const fire = confettiRef.current?.fire;
    if (fire) {
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
      const particleCount = 50;
      fire({ ...defaults, particleCount, origin: { x: 0, y: 1 }, angle: 60 });
      fire({ ...defaults, particleCount, origin: { x: 1, y: 1 }, angle: 120 });
    }
  }, []);

  async function runEmailSubmit() {
    if (!onEmailSubmit) {
      setModalStatus("loading");
      const loadingStepsCount = modalSteps.length - 1;
      const totalDuration = loadingStepsCount * TEXT_LOOP_INTERVAL * 1000;
      setTimeout(() => {
        fireSideCanons();
        setModalStatus("success");
      }, totalDuration);
      return;
    }
    setModalStatus("loading");
    try {
      const result = await onEmailSubmit({ email, password, mode });
      if (typeof result === "string" && result.length > 0) {
        setModalErrorMessage(result);
        setModalStatus("error");
        return;
      }
      fireSideCanons();
      setModalStatus("success");
    } catch (err) {
      setModalErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setModalStatus("error");
    }
  }

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalStatus !== "closed") return;

    if (isSignUp) {
      if (authStep !== "confirmPassword") return;
      if (password !== confirmPassword) {
        setModalErrorMessage("Passwords do not match!");
        setModalStatus("error");
        return;
      }
    } else {
      if (authStep !== "password") return;
    }
    void runEmailSubmit();
  };

  const handleProgressStep = () => {
    if (authStep === "email") {
      if (isEmailValid) setAuthStep("password");
    } else if (authStep === "password") {
      if (!isPasswordValid) return;
      if (isSignUp) {
        setAuthStep("confirmPassword");
      } else {
        void runEmailSubmit();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleProgressStep();
    }
  };

  const handleGoBack = () => {
    if (authStep === "confirmPassword") {
      setAuthStep("password");
      setConfirmPassword("");
    } else if (authStep === "password") {
      setAuthStep("email");
    }
  };

  const closeModal = () => {
    setModalStatus("closed");
    setModalErrorMessage("");
  };

  useEffect(() => {
    if (authStep === "password") setTimeout(() => passwordInputRef.current?.focus(), 500);
    else if (authStep === "confirmPassword") setTimeout(() => confirmPasswordInputRef.current?.focus(), 500);
  }, [authStep]);

  useEffect(() => {
    if (modalStatus === "success") fireSideCanons();
  }, [modalStatus, fireSideCanons]);

  const titles = {
    "sign-up": {
      main: "Get started with CalibiAI",
      passwordTitle: "Create your password",
      passwordHint: "Your password must be at least 6 characters long.",
      confirmTitle: "One Last Step",
      confirmHint: "Confirm your password to continue",
    },
    "sign-in": {
      main: "Welcome back",
      passwordTitle: "Enter your password",
      passwordHint: "Use the password associated with this account.",
      confirmTitle: "",
      confirmHint: "",
    },
  }[mode];

  return (
    <div className="relative z-10">
      <Confetti
        ref={confettiRef}
        manualstart
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-[999]"
      />

      <AnimatePresence>
        {modalStatus !== "closed" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative glass-panel-strong border-4 border-border rounded-2xl p-8 w-full max-w-sm flex flex-col items-center gap-4 mx-2"
            >
              {(modalStatus === "error" || modalStatus === "success") && (
                <button
                  onClick={closeModal}
                  className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              {modalStatus === "error" && (
                <>
                  <AlertCircle className="w-12 h-12 text-destructive" />
                  <p className="text-lg font-medium text-foreground text-center">{modalErrorMessage}</p>
                  <GlassButton onClick={closeModal} size="sm" className="mt-4">
                    Try Again
                  </GlassButton>
                </>
              )}
              {modalStatus === "loading" && (
                <TextLoop interval={TEXT_LOOP_INTERVAL} stopOnEnd>
                  {modalSteps.slice(0, -1).map((step, i) => (
                    <div key={i} className="flex flex-col items-center gap-4">
                      {step.icon}
                      <p className="text-lg font-medium text-foreground">{step.message}</p>
                    </div>
                  ))}
                </TextLoop>
              )}
              {modalStatus === "success" && (
                <div className="flex flex-col items-center gap-4">
                  {modalSteps[modalSteps.length - 1].icon}
                  <p className="text-lg font-medium text-foreground">
                    {modalSteps[modalSteps.length - 1].message}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex w-full flex-1 h-full items-center justify-center bg-transparent">
        <fieldset
          disabled={modalStatus !== "closed"}
          className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm mx-auto p-4"
        >
          <AnimatePresence mode="wait">
            {authStep === "email" && (
              <motion.div
                key="email-content"
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full flex flex-col items-center gap-4"
              >
                <BlurFade delay={0.25} className="w-full">
                  <div className="text-center">
                    <p className="font-serif font-light text-4xl sm:text-5xl md:text-6xl tracking-tight text-primary whitespace-nowrap">
                      {titles.main}
                    </p>
                  </div>
                </BlurFade>
                <BlurFade delay={0.5}>
                  <p className="text-sm font-medium text-secondary text-center">Continue with</p>
                </BlurFade>
                <BlurFade delay={0.75}>
                  <div className="flex items-center justify-center gap-4 w-full">
                    <GlassButton
                      type="button"
                      contentClassName="flex items-center justify-center gap-2"
                      size="sm"
                      onClick={() => onOAuth?.("google")}
                      className="w-full"
                    >
                      <GoogleIcon />
                      <span className="font-semibold text-foreground">Continue with Google</span>
                    </GlassButton>
                    <GlassButton
                      type="button"
                      contentClassName="flex items-center justify-center gap-2"
                      size="sm"
                      onClick={() => onOAuth?.("github")}
                      className="w-full"
                    >
                      <GitHubIcon />
                      <span className="font-semibold text-foreground">Continue with GitHub</span>
                    </GlassButton>
                  </div>
                </BlurFade>
                <BlurFade delay={1} className="w-full max-w-sm">
                  <div className="flex items-center w-full gap-2 py-2">
                    <hr className="w-full border-slate-200/60 dark:border-slate-800/60" />
                    <span className="text-xs font-semibold text-subtle">OR</span>
                    <hr className="w-full border-slate-200/60 dark:border-slate-800/60" />
                  </div>
                </BlurFade>
              </motion.div>
            )}
            {authStep === "password" && (
              <motion.div
                key="password-title"
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full flex flex-col items-center text-center gap-4"
              >
                <BlurFade delay={0} className="w-full">
                  <div className="text-center">
                    <p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-primary whitespace-nowrap">
                      {titles.passwordTitle}
                    </p>
                  </div>
                </BlurFade>
                <BlurFade delay={0.25}>
                  <p className="text-sm font-medium text-secondary">{titles.passwordHint}</p>
                </BlurFade>
              </motion.div>
            )}
            {authStep === "confirmPassword" && isSignUp && (
              <motion.div
                key="confirm-title"
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full flex flex-col items-center text-center gap-4"
              >
                <BlurFade delay={0} className="w-full">
                  <div className="text-center">
                    <p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-primary whitespace-nowrap">
                      {titles.confirmTitle}
                    </p>
                  </div>
                </BlurFade>
                <BlurFade delay={0.25}>
                  <p className="text-sm font-medium text-secondary">{titles.confirmHint}</p>
                </BlurFade>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleFinalSubmit} className="w-full max-w-sm space-y-6">
            <AnimatePresence>
              {authStep !== "confirmPassword" && (
                <motion.div
                  key="email-password-fields"
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-full space-y-6"
                >
                  <BlurFade delay={authStep === "email" ? 1.25 : 0} inView className="w-full">
                    <div className="relative w-full">
                      <AnimatePresence>
                        {authStep === "password" && (
                          <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                            className="absolute -top-6 left-4 z-10"
                          >
                            <label className="text-xs text-muted-foreground font-semibold">Email</label>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="input-wrapper">
                        <input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="input"
                          autoComplete="email"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <GlassButton
                            type="button"
                            onClick={handleProgressStep}
                            size="icon"
                            aria-label="Continue with email"
                            contentClassName="text-secondary hover:text-primary"
                            disabled={!isEmailValid || authStep !== "email"}
                          >
                            <ArrowRight className="w-5 h-5" />
                          </GlassButton>
                        </div>
                      </div>
                    </div>
                  </BlurFade>

                  <AnimatePresence>
                    {authStep === "password" && (
                      <BlurFade key="password-field" className="w-full">
                        <div className="relative w-full">
                          <AnimatePresence>
                            {password.length > 0 && (
                              <motion.div
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="absolute -top-6 left-4 z-10"
                              >
                                <label className="text-xs text-muted-foreground font-semibold">Password</label>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div className="input-wrapper relative">
                            <input
                              ref={passwordInputRef}
                              type={showPassword ? "text" : "password"}
                              placeholder="Password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="input pr-12"
                              autoComplete={isSignUp ? "new-password" : "current-password"}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              <button
                                type="button"
                                aria-label="Toggle password visibility"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-secondary hover:text-primary transition-colors p-1 rounded-lg"
                              >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                              <GlassButton
                                type={isSignUp ? "button" : "submit"}
                                onClick={isSignUp ? handleProgressStep : undefined}
                                size="icon"
                                aria-label="Submit password"
                                contentClassName="text-secondary hover:text-primary"
                                disabled={!isPasswordValid}
                              >
                                <ArrowRight className="w-5 h-5" />
                              </GlassButton>
                            </div>
                          </div>
                        </div>
                        <BlurFade inView delay={0.2}>
                          <button
                            type="button"
                            onClick={handleGoBack}
                            className="mt-4 flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
                          >
                            <ArrowLeft className="w-4 h-4" /> Go back
                          </button>
                        </BlurFade>
                      </BlurFade>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {authStep === "confirmPassword" && isSignUp && (
                <BlurFade key="confirm-password-field" className="w-full">
                  <div className="relative w-full">
                    <AnimatePresence>
                      {confirmPassword.length > 0 && (
                        <motion.div
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="absolute -top-6 left-4 z-10"
                        >
                          <label className="text-xs text-muted-foreground font-semibold">Confirm Password</label>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="input-wrapper relative">
                      <input
                        ref={confirmPasswordInputRef}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input pr-12"
                        autoComplete="new-password"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Toggle confirm password visibility"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-secondary hover:text-primary transition-colors p-1 rounded-lg"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <GlassButton
                          type="submit"
                          size="icon"
                          aria-label="Finish sign-up"
                          contentClassName="text-secondary hover:text-primary"
                          disabled={!isConfirmPasswordValid}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </GlassButton>
                      </div>
                    </div>
                  </div>
                  <BlurFade inView delay={0.2}>
                    <button
                      type="button"
                      onClick={handleGoBack}
                      className="mt-4 flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Go back
                    </button>
                  </BlurFade>
                </BlurFade>
              )}
            </AnimatePresence>
          </form>

          {switchHref && (
            <p className="text-sm text-secondary text-center">
              {isSignUp ? "Already have an account? " : "New here? "}
              <a href={switchHref} className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                {isSignUp ? "Sign in" : "Create an account"}
              </a>
            </p>
          )}
        </fieldset>
      </div>
    </div>
  );
};
