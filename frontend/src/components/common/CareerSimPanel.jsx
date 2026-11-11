import * as React from "react";
import { Sparkles, Clock, TrendingUp, Target, ChevronDown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  trackReadinessPct,
  estimatedWeeksToGoal,
  projectedReadiness,
  rankedGaps,
} from "@/data/tracks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ReadinessGauge } from "@/components/common/ReadinessGauge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const HORIZON = 8; // weeks — the "sprint" window we project over

export function CareerSimPanel({ className }) {
  const { tracks, activeTrackId, userProfile, simulatedHours, setSimulatedHours } = useApp();

  const [simTrackId, setSimTrackId] = React.useState(activeTrackId);
  const hours = simulatedHours ?? (userProfile.weeklyTimeHours || 6);
  const setHours = setSimulatedHours;

  // Keep sim in sync if the global track changes underneath us
  React.useEffect(() => {
    setSimTrackId(activeTrackId);
  }, [activeTrackId]);

  const track = tracks[simTrackId] || tracks[activeTrackId];
  const roleOptions = Object.values(tracks);

  if (!track) return null;

  const current = trackReadinessPct(track);
  const projected = projectedReadiness(track, hours, HORIZON);
  const weeksToGoal = estimatedWeeksToGoal(track, hours);
  const delta = projected - current;
  const gaps = rankedGaps(track).slice(0, 4);

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-primary/25 bg-gradient-to-br from-primary/[0.06] via-card to-card",
        className
      )}
    >
      {/* glow accent */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />

      <CardHeader className="relative flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <Sparkles className="size-4" />
          </span>
          <div>
            <CardTitle className="text-base">Career Simulator</CardTitle>
            <p className="text-xs text-muted-foreground">
              What-if: see your path recompute live
            </p>
          </div>
        </div>
        <Badge variant="accent">Live</Badge>
      </CardHeader>

      <CardContent className="relative space-y-5">
        {/* Role switcher */}
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Target className="size-4" /> Target role
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
                {track.label}
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {roleOptions.map((t) => (
                <DropdownMenuItem key={t.id} onSelect={() => setSimTrackId(t.id)}>
                  {t.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Weekly hours slider */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-4" /> Weekly commitment
            </span>
            <span className="font-mono font-semibold text-foreground">
              {hours} hrs/wk
            </span>
          </div>
          <Slider
            value={[hours]}
            min={2}
            max={20}
            step={1}
            onValueChange={(v) => setHours(v[0])}
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>2h</span>
            <span>20h</span>
          </div>
        </div>

        {/* Projection */}
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card/70 p-4">
          <ReadinessGauge
            value={projected}
            size={104}
            strokeWidth={9}
            animate={false}
            label="projected"
          />
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Readiness in {HORIZON} weeks
              </p>
              <p className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-foreground">
                  {projected}%
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-semibold",
                    delta > 0 ? "text-success" : "text-muted-foreground"
                  )}
                >
                  <TrendingUp className="size-3" />+{delta}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Est. time to job-ready</p>
              <p className="font-mono text-lg font-bold text-primary">
                ~{weeksToGoal} weeks
              </p>
            </div>
          </div>
        </div>

        {/* Re-ranked gaps */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Priority gaps to close
          </p>
          <div className="space-y-2">
            {gaps.map((g) => (
              <div key={g.skill} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm text-foreground">
                  {g.skill}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-warning transition-all duration-500"
                    style={{ width: `${Math.min(100, g.gap)}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {g.gap}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground/80">
          Simulated client-side from your verified skills and weekly time — drag
          the slider or switch roles to watch the plan adapt.
        </p>
      </CardContent>
    </Card>
  );
}

export default CareerSimPanel;
