import { cn } from "@/lib/utils";

/**
 * The CalibiAI brand mark: a "C" bracket and an "A", joined by a neural
 * network graph.
 *
 * Drawn as inline SVG rather than shipping the raster logo so it stays crisp
 * at every size, needs no network request, and can inherit its colour from
 * the surrounding text. Use `currentColor` on the parent to theme it — the
 * mark is a single flat colour by design.
 */
export function CalibiAiMark({
  className,
  compact = false,
}: {
  className?: string;
  /**
   * Thickens the network edges for small render sizes. At a 32px-tall mark the
   * true 11-unit edges resolve to ~0.65 device px, which browsers wash out to a
   * faint grey; 22 units keeps them a crisp ~1.3px. Use for anything under
   * roughly 40px tall (headers, footers, favicons).
   */
  compact?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 780 540"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("h-full w-auto", className)}
    >
      <g stroke="currentColor" fill="currentColor">
        {/* C bracket */}
        <path
          d="M292 28 H115 A87 87 0 0 0 28 115 V417 A87 87 0 0 0 115 504 H292"
          fill="none"
          strokeWidth={52}
          strokeLinecap="butt"
          strokeLinejoin="miter"
        />

        {/* A — left leg, right leg, crossbar */}
        <path d="M545 24 L600 24 L536 516 L470 516 Z" stroke="none" />
        <path d="M545 24 L600 24 L752 516 L672 516 Z" stroke="none" />
        <rect x={512} y={390} width={190} height={46} stroke="none" />

        {/* Neural network edges */}
        <g strokeWidth={compact ? 22 : 11} strokeLinecap="round">
          <line x1={357} y1={38} x2={171} y2={168} />
          <line x1={357} y1={38} x2={171} y2={353} />
          <line x1={357} y1={38} x2={526} y2={272} />
          <line x1={357} y1={492} x2={171} y2={168} />
          <line x1={357} y1={492} x2={171} y2={353} />
          <line x1={357} y1={492} x2={526} y2={272} />
          <line x1={171} y1={168} x2={357} y2={202} />
          <line x1={171} y1={168} x2={357} y2={327} />
          <line x1={171} y1={353} x2={357} y2={202} />
          <line x1={171} y1={353} x2={357} y2={327} />
          <line x1={357} y1={202} x2={526} y2={272} />
          <line x1={357} y1={327} x2={526} y2={272} />
        </g>

        {/* Neural network nodes */}
        <g stroke="none">
          <circle cx={357} cy={38} r={42} />
          <circle cx={171} cy={168} r={42} />
          <circle cx={357} cy={202} r={40} />
          <circle cx={526} cy={272} r={42} />
          <circle cx={357} cy={327} r={40} />
          <circle cx={171} cy={353} r={42} />
          <circle cx={357} cy={492} r={42} />
        </g>
      </g>
    </svg>
  );
}
