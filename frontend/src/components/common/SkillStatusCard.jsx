import * as React from "react";
import { CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Classify a skill by its current/target ratio. */
export function classifySkill(current, target) {
  const ratio = target > 0 ? current / target : 0;
  if (ratio >= 0.75)
    return {
      key: "verified",
      label: "Verified",
      icon: CheckCircle2,
      text: "text-success",
      bar: "bg-success",
      chip: "bg-success/12 text-success",
      ring: "ring-success/25",
    };
  if (ratio >= 0.5)
    return {
      key: "developing",
      label: "Developing",
      icon: TrendingUp,
      text: "text-primary",
      bar: "bg-primary",
      chip: "bg-primary/10 text-primary",
      ring: "ring-primary/25",
    };
  return {
    key: "weak",
    label: "Weak spot",
    icon: AlertTriangle,
    text: "text-warning",
    bar: "bg-warning",
    chip: "bg-warning/15 text-warning",
    ring: "ring-warning/25",
  };
}

/** Verified / Developing / Weak-spot skill card. Reused on SkillCheck + Dashboard. */
export function SkillStatusCard({ skill, current, target, className }) {
  const info = classifySkill(current, target);
  const Icon = info.icon;
  const pct = Math.min(100, Math.round((current / target) * 100));

  return (
    <Card className={cn("p-4 transition-shadow hover:shadow-md", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium text-foreground">{skill}</span>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            info.chip
          )}
        >
          <Icon className="size-3" />
          {info.label}
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", info.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between font-mono text-xs text-muted-foreground">
        <span>
          now <span className={cn("font-semibold", info.text)}>{current}</span>
        </span>
        <span>target {target}</span>
      </div>
    </Card>
  );
}

export default SkillStatusCard;
