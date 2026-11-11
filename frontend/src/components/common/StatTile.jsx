import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const toneMap = {
  primary: "text-primary bg-primary/10",
  success: "text-success bg-success/12",
  warning: "text-warning bg-warning/15",
  muted: "text-muted-foreground bg-secondary",
};

/** Compact metric tile: icon chip + value + label (+ optional hint). */
export function StatTile({ icon: Icon, value, label, hint, tone = "primary", className }) {
  return (
    <Card
      className={cn(
        "flex items-center gap-3 p-4 transition-shadow hover:shadow-md",
        className
      )}
    >
      {Icon && (
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            toneMap[tone]
          )}
        >
          <Icon className="size-5" />
        </span>
      )}
      <div className="min-w-0">
        <div className="font-mono text-xl font-bold leading-none text-foreground">
          {value}
        </div>
        <div className="mt-1 truncate text-xs font-medium text-muted-foreground">
          {label}
        </div>
        {hint && (
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground/70">
            {hint}
          </div>
        )}
      </div>
    </Card>
  );
}

export default StatTile;
