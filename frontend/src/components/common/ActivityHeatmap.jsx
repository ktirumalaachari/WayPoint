import * as React from "react";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const LEVELS = [
  "bg-secondary",
  "bg-success/25",
  "bg-success/45",
  "bg-success/65",
  "bg-success/90",
];

/** GitHub-style 90-day learning activity grid (FR6.6). */
export function ActivityHeatmap({ className }) {
  const { userProfile } = useApp();
  // Memoize heatmap array so downstream week chunking keeps a stable reference
  const data = React.useMemo(
    () => userProfile.heatmapData || [],
    [userProfile.heatmapData]
  );
  const activeDays = data.filter((d) => d.active).length;

  // Chunk 90 days into weeks (columns of 7).
  const weeks = React.useMemo(() => {
    const out = [];
    for (let i = 0; i < data.length; i += 7) out.push(data.slice(i, i + 7));
    return out;
  }, [data]);

  return (
    <Card className={cn("p-5", className)}>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">
            Learning activity
          </h3>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">
              {activeDays}
            </span>{" "}
            active days in the last 90
          </p>
        </div>
      </div>

      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date} — ${day.active ? `${day.intensity} session${day.intensity > 1 ? "s" : ""}` : "no activity"}`}
                className={cn(
                  "size-3 rounded-[3px] transition-colors",
                  LEVELS[day.intensity]
                )}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
        <span>Less</span>
        {LEVELS.map((lv, i) => (
          <span key={i} className={cn("size-3 rounded-[3px]", lv)} />
        ))}
        <span>More</span>
      </div>
    </Card>
  );
}

export default ActivityHeatmap;
