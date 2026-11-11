import * as React from "react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

/**
 * WayPoint signature element — animated radial Readiness Gauge.
 * SVG arc + brand gradient + count-up center number.
 * Reused on SkillCheck reveal, Dashboard hero, and (mini) Track Selector.
 */
export function ReadinessGauge({
  value = 0,
  size = 200,
  strokeWidth = 14,
  label = "Readiness",
  sublabel,
  animate = true,
  duration = 1400,
  className,
  showValue = true,
}) {
  const gradientId = React.useId();
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const animated = useCountUp(clamped, duration, animate);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animated / 100);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5b5fef" />
            <stop offset="55%" stopColor="#7c6cf0" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-secondary"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: animate ? "none" : "stroke-dashoffset 0.6s ease" }}
        />
      </svg>

      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-start font-mono font-bold tracking-tight text-foreground">
            <span style={{ fontSize: size * 0.28 }} className="leading-none">
              {animated}
            </span>
            <span
              style={{ fontSize: size * 0.12 }}
              className="mt-1 text-muted-foreground"
            >
              %
            </span>
          </div>
          {label && (
            <span
              className="mt-1 font-medium uppercase tracking-wider text-muted-foreground"
              style={{ fontSize: Math.max(10, size * 0.06) }}
            >
              {label}
            </span>
          )}
          {sublabel && (
            <span
              className="mt-0.5 text-muted-foreground/80"
              style={{ fontSize: Math.max(9, size * 0.055) }}
            >
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ReadinessGauge;
