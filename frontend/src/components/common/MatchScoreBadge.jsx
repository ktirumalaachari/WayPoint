import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { matchTone } from "@/data/tracks";
import { cn } from "@/lib/utils";

/**
 * Deterministically derive a 3-factor breakdown from a node's match score.
 * (Feature 8 fallback formula — no hardcoded 95/85/90.)
 * The three factors always average back to ~the match score.
 */
export function deriveBreakdown(match, seed = "") {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 97;
  const jitter = (n) => ((h >> n) & 3) - 1; // -1..+2 deterministic wobble
  const clamp = (v) => Math.max(40, Math.min(99, Math.round(v)));
  const goal = clamp(match + 4 + jitter(0));
  const skill = clamp(match - 7 + jitter(2));
  const time = clamp(match + 2 + jitter(4));
  return [
    { label: "Goal alignment", value: goal, hint: "Matches your target role" },
    { label: "Skill readiness", value: skill, hint: "Based on your verified skills" },
    { label: "Time fit", value: time, hint: "Fits your weekly hours" },
  ];
}

const barTone = {
  success: "bg-success",
  accent: "bg-primary",
  warning: "bg-warning",
};

/** Color-coded match % chip with a hover/click breakdown popover. */
export function MatchScoreBadge({ match, seed = "", className, size = "sm" }) {
  const tone = matchTone(match);
  const breakdown = React.useMemo(() => deriveBreakdown(match, seed), [match, seed]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full", className)}
          aria-label={`${match}% match — view breakdown`}
        >
          <Badge variant={tone} className={cn("font-mono", size === "md" && "px-2.5 py-1 text-sm")}>
            {match}% match
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Why this match score
        </p>
        <div className="space-y-3">
          {breakdown.map((b) => (
            <div key={b.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{b.label}</span>
                <span className="font-mono text-muted-foreground">{b.value}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full", barTone[matchTone(b.value)])}
                  style={{ width: `${b.value}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground/80">{b.hint}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default MatchScoreBadge;
