"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "scale" | "none";
  delay?: number;
  duration?: number;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  disabled?: boolean;
}

export function ScrollReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 600,
  threshold = 0.1,
  rootMargin = "0px 0px -50px 0px",
  once = true,
  disabled = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (disabled || typeof window === "undefined") {
      setTimeout(() => setIsVisible(true), 0);
      return;
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      setTimeout(() => setIsVisible(true), 0);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true);
              setHasAnimated(true);
            }, delay);
            if (once) {
              observer.unobserve(element);
            }
          } else if (!once && !hasAnimated) {
            setIsVisible(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [delay, threshold, rootMargin, once, disabled, hasAnimated]);

  const directionClasses = {
    up: "reveal-on-scroll",
    down: "reveal-on-scroll", // same as up, just different transform origin
    left: "reveal-on-scroll-left",
    right: "reveal-on-scroll-right",
    scale: "reveal-on-scroll-scale",
    none: "",
  };

  const baseClass = directionClasses[direction] || "reveal-on-scroll";
  const visibleClass = isVisible ? "is-visible" : "";

  return (
    <div
      ref={ref}
      className={cn(baseClass, visibleClass, className)}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/* Staggered Children Wrapper */
interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  disabled?: boolean;
}

export function StaggerReveal({
  children,
  className,
  staggerDelay = 100,
  direction = "up",
  threshold = 0.1,
  rootMargin = "0px 0px -50px 0px",
  once = true,
  disabled = false,
}: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (disabled || typeof window === "undefined") {
      setTimeout(() => setIsVisible(true), 0);
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      setTimeout(() => setIsVisible(true), 0);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasAnimated(true);
            if (once) {
              observer.unobserve(element);
            }
          } else if (!once && !hasAnimated) {
            setIsVisible(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once, disabled, hasAnimated]);

  const directionClasses = {
    up: "reveal-on-scroll",
    down: "reveal-on-scroll",
    left: "reveal-on-scroll-left",
    right: "reveal-on-scroll-right",
    scale: "reveal-on-scroll-scale",
  };

  const baseClass = directionClasses[direction] || "reveal-on-scroll";

  return (
    <div
      ref={ref}
      className={cn(baseClass, isVisible && "is-visible", className)}
      style={{ transitionDuration: "600ms" } as React.CSSProperties}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        const childElement = child as React.ReactElement<{ className?: string; style?: React.CSSProperties }>;
        return React.cloneElement(childElement, {
          className: cn(
            childElement.props.className,
            isVisible ? "is-visible" : "",
            "reveal-on-scroll"
          ),
          style: {
            ...(childElement.props.style as React.CSSProperties),
            transitionDuration: "600ms",
            transitionDelay: `${index * staggerDelay}ms`,
          } as React.CSSProperties,
        });
      })}
    </div>
  );
}

/* Parallax Scroll Effect */
interface ParallaxProps {
  children: ReactNode;
  className?: string;
  speed?: number; // 0.5 = half speed, 1 = normal, 2 = double
  direction?: "vertical" | "horizontal";
}

export function Parallax({
  children,
  className,
  speed = 0.5,
  direction = "vertical",
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const scrolled = window.scrollY;
      const elementTop = rect.top + scrolled;
      const elementHeight = rect.height;
      const windowHeight = window.innerHeight;

      // Calculate how far the element is from center of viewport
      const distanceFromCenter = elementTop + elementHeight / 2 - (scrolled + windowHeight / 2);
      const offset = distanceFromCenter * speed;

      if (direction === "vertical") {
        setTransform(`translate3d(0, ${offset}px, 0)`);
      } else {
        setTransform(`translate3d(${offset}px, 0, 0)`);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed, direction]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <div
        style={{ transform } as React.CSSProperties}
        className="will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}

/* Magnetic Hover Effect */
interface MagneticProps {
  children: ReactNode;
  className?: string;
  strength?: number; // 0.1 to 1
}

export function Magnetic({
  children,
  className,
  strength = 0.3,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTransform(`translate3d(${x * strength}px, ${y * strength}px, 0)`);
  };

  const handleMouseLeave = () => {
    setTransform("translate3d(0, 0, 0)");
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative transition-transform duration-300 ease-out", className)}
      style={{ transform } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/* Floating Animation Wrapper */
interface FloatingProps {
  children: ReactNode;
  className?: string;
  amplitude?: number; // pixels
  duration?: number; // ms
  delay?: number;
}

export function Floating({
  children,
  className,
  amplitude = 8,
  duration = 3000,
  delay = 0,
}: FloatingProps) {
  return (
    <div
      className={cn("animate-float", className)}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
        transform: `translateY(0)`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/* Glow on Hover */
interface GlowOnHoverProps {
  children: ReactNode;
  className?: string;
  color?: "brand" | "success" | "warning" | "danger" | "info" | "purple";
  intensity?: "subtle" | "normal" | "strong";
}

export function GlowOnHover({
  children,
  className,
  color = "brand",
  intensity = "normal",
}: GlowOnHoverProps) {
  const colorClasses = {
    brand: "from-brand-500/30 via-indigo-500/20 to-purple-500/30",
    success: "from-emerald-500/30 via-teal-500/20 to-cyan-500/30",
    warning: "from-amber-500/30 via-orange-500/20 to-rose-500/30",
    danger: "from-rose-500/30 via-red-500/20 to-pink-500/30",
    info: "from-cyan-500/30 via-blue-500/20 to-indigo-500/30",
    purple: "from-purple-500/30 via-indigo-500/20 to-pink-500/30",
  };

  const intensityClasses = {
    subtle: "blur-3xl opacity-30",
    normal: "blur-2xl opacity-50",
    strong: "blur-xl opacity-70",
  };

  // Ensure children is a valid React element
  const childElement = React.isValidElement(children) 
    ? children as React.ReactElement<{ className?: string }>
    : null;

  return (
    <div className={cn("relative group", className)}>
      <div
        className={cn(
          "absolute inset-0 rounded-[inherit] -z-10 transition-opacity duration-500 opacity-0",
          colorClasses[color],
          intensityClasses[intensity]
        )}
      />
      {childElement ? React.cloneElement(childElement, {
        className: cn(
          childElement.props.className,
          "relative z-10",
          "group-hover:shadow-xl transition-shadow duration-500"
        ),
      }) : children}
    </div>
  );
}

import React from "react";