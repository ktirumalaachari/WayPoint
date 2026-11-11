import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Flame,
  TrendingUp,
  Clock,
  ArrowRight,
  Check,
  ChevronRight,
  Share2,
  PlayCircle,
  Target,
  ShieldCheck,
  ListChecks,
  User,
  GraduationCap,
  Briefcase,
  Heart,
  Star,
  AlertTriangle,
  Building2,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useApp } from "@/context/AppContext";
import {
  TREE_BRANCHES,
  trackCompletionPct,
  trackReadinessPct,
  trackHighPriorityGaps,
  trackVerifiedCount,
  suggestedNextId,
  estimatedWeeksToGoal,
  rankedGaps,
} from "@/data/tracks";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReadinessGauge } from "@/components/common/ReadinessGauge";
import { StatTile } from "@/components/common/StatTile";
import { ActivityHeatmap } from "@/components/common/ActivityHeatmap";
import { CareerSimPanel } from "@/components/common/CareerSimPanel";
import { ShareReadinessDialog } from "@/components/common/ShareReadinessDialog";

function MilestoneTimeline({ track }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 font-display text-base font-semibold">Milestone timeline</h3>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TREE_BRANCHES.map((b, i) => {
          const done = b.children.every((id) => track.nodeMap[id].status === "completed");
          const started = b.children.some((id) => track.nodeMap[id].status !== "not_started");
          return (
            <React.Fragment key={b.id}>
              <div className="flex shrink-0 flex-col items-center gap-2">
                <div
                  className={
                    "flex size-9 items-center justify-center rounded-full " +
                    (done
                      ? "bg-success text-success-foreground"
                      : started
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-secondary text-muted-foreground")
                  }
                >
                  {done ? <Check className="size-4" /> : <span className="font-mono text-xs font-bold">{i + 1}</span>}
                </div>
                <span className="whitespace-nowrap text-xs font-medium">{b.label}</span>
              </div>
              {i < TREE_BRANCHES.length - 1 && (
                <div className={"mb-6 h-0.5 w-10 shrink-0 rounded-full " + (done ? "bg-success" : "bg-border")} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
}



/** Alternate skill-gap view — horizontal bars sorted largest-gap-first,
    with a marker at each target (toggle counterpart to the radar). */
// Prevents Cumulative Layout Shift (CLS)
function SkillGapBars({ track }) {
  const gaps = rankedGaps(track);
  return (
    <div className="space-y-3.5 py-1">
      {gaps.map((s, i) => {
        const tone =
          s.gap >= 40
            ? "bg-warning/15 text-warning"
            : s.gap >= 15
              ? "bg-primary/15 text-primary"
              : "bg-success/15 text-success";
        return (
          <div key={s.skill}>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium">{s.skill}</span>
              <span className="flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground">
                <span>
                  {s.current}
                  <span className="mx-0.5 text-muted-foreground/60">→</span>
                  {s.target}
                </span>
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", tone)}>
                  {s.gap === 0 ? "on target" : `+${s.gap}`}
                </span>
              </span>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary/15"
                style={{ width: `${s.target}%` }}
              />
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-[#8b5cf6]"
                initial={{ width: 0 }}
                animate={{ width: `${s.current}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              />
              <div
                className="absolute inset-y-[-1px] w-0.5 rounded bg-foreground/50"
                style={{ left: `calc(${s.target}% - 1px)` }}
              />
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-4 pt-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-full bg-gradient-to-r from-primary to-[#8b5cf6]" /> Current
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-0.5 rounded bg-foreground/50" /> Target
        </span>
      </div>
    </div>
  );
}

/** Prioritized "what to do next" — the missing problem-statement piece:
    turns the readiness diagnosis into concrete, clickable next actions. */
function NextActionsCard({ track, suggestedNode, navigate }) {
  const topGap = rankedGaps(track).find((s) => s.gap > 0);
  const actions = [];
  if (suggestedNode) {
    actions.push({
      icon: PlayCircle,
      tone: "bg-primary/10 text-primary",
      label: `Start "${suggestedNode.title}"`,
      hint: `${suggestedNode.match}% match · ${suggestedNode.duration}`,
      onClick: () => navigate("/roadmap"),
    });
  }
  if (topGap) {
    actions.push({
      icon: Target,
      tone: "bg-warning/15 text-warning",
      label: `Close your ${topGap.skill} gap`,
      hint: `+${topGap.gap} points to target`,
      onClick: () => navigate("/roadmap"),
    });
  }
  actions.push({
    icon: ShieldCheck,
    tone: "bg-success/15 text-success",
    label: "Verify a weak skill",
    hint: "Re-take a quick skill check",
    onClick: () => navigate("/skill-check"),
  });

  return (
    <Card className="flex-1 p-4">
      <div className="mb-3 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        <ListChecks className="size-3.5" /> Next best actions
      </div>
      <div className="space-y-2">
        {actions.slice(0, 3).map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={a.onClick}
              className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card/60 p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", a.tone)}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{a.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{a.hint}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/** Learner Profile card — shows the rich profile from onboarding chat on the dashboard. */
function LearnerProfileCard({ userProfile }) {
  const dc = userProfile.detailedContext || {};
  const hasProfile = userProfile.pastExperience || userProfile.careerGoals || dc.education;

  if (!hasProfile) return null;

  const profileItems = [
    { icon: GraduationCap, label: "Education", value: dc.education, tone: "text-primary" },
    { icon: Briefcase, label: "Experience", value: userProfile.pastExperience, tone: "text-blue-500" },
    { icon: Target, label: "Career Goal", value: userProfile.careerGoals, tone: "text-violet-500" },
    { icon: Star, label: "Strengths", value: dc.strengths, tone: "text-amber-500" },
    { icon: AlertTriangle, label: "Areas to Improve", value: dc.weaknesses, tone: "text-orange-500" },
    { icon: Building2, label: "Dream Company", value: dc.dreamCompany, tone: "text-emerald-500" },
    { icon: Heart, label: "Motivation", value: dc.motivation, tone: "text-rose-500" },
  ].filter((item) => item.value && item.value !== "Not specified" && item.value !== "Failed to extract");

  if (profileItems.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.04] to-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <User className="size-4" />
          </span>
          <CardTitle className="text-base">Learner Profile</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 max-h-[240px] overflow-y-auto pr-2">
        {profileItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-start gap-2.5">
              <span className={cn("mt-0.5 shrink-0", item.tone)}>
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-sm leading-snug text-foreground">{item.value}</p>
              </div>
            </div>
          );
        })}
        {userProfile.learningStyle && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs capitalize">
              📚 {userProfile.learningStyle?.replace("-", " ")}
            </Badge>
            {userProfile.weeklyTimeHours && (
              <Badge variant="outline" className="text-xs">
                ⏰ {userProfile.weeklyTimeHours} hrs/week
              </Badge>
            )}
          </div>
        )}
        {dc.preferredLanguages && dc.preferredLanguages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {dc.preferredLanguages.map((lang) => (
              <Badge key={lang} variant="secondary" className="text-[11px]">
                {lang}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeTrackId, tracks, userProfile, isLoading } = useApp();
  const track = tracks[activeTrackId] || Object.values(tracks)[0];

  React.useEffect(() => {
    if (!isLoading && !track) {
      navigate("/roadmap");
    }
  }, [isLoading, track, navigate]);

  if (!track) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="h-96 animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  const readiness = trackReadinessPct(track);
  const gaps = trackHighPriorityGaps(track);
  const verified = trackVerifiedCount(track);
  const completion = trackCompletionPct(track);
  const hours = userProfile.weeklyTimeHours || 6;
  const weeksLeft = estimatedWeeksToGoal(track, hours);
  const suggested = suggestedNextId(track);
  const suggestedNode = suggested ? track.nodeMap[suggested] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Your Progress</h1>
          <p className="text-sm text-muted-foreground">{track.label} Track</p>
        </div>
        <ShareReadinessDialog
          trigger={
            <Button variant="outline" size="sm">
              <Share2 className="size-4" /> Share readiness
            </Button>
          }
        />
      </div>

      {/* Readiness hero */}
      <Card className="mb-5 overflow-hidden border-primary/25 bg-gradient-to-br from-primary/[0.06] via-card to-card">
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:gap-8">
          <ReadinessGauge value={readiness} size={148} strokeWidth={12} label="Ready" />
          <div className="flex-1 text-center sm:text-left">
            <p className="font-mono text-[11px] uppercase tracking-wide text-primary">
              Career readiness — {track.label}
            </p>
            <p className="mt-1 max-w-lg text-sm text-foreground">
              Evidence-based — it moves as you complete quizzes, projects, and milestones, not just
              course-completion %.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge variant="success">{verified} skills verified</Badge>
              {gaps > 0 ? (
                <div className="flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning">
                  <span>{gaps} high-priority gaps:</span>
                  <span className="font-medium text-warning/80">
                    {track.skillData.filter(s => s.current / s.target < 0.5).map(s => s.skill).join(', ')}
                  </span>
                </div>
              ) : (
                <Badge variant="warning">0 high-priority gaps</Badge>
              )}
            </div>
          </div>
          {suggestedNode && (
            <div className="w-full shrink-0 rounded-xl border border-border bg-card/70 p-4 sm:w-56">
              <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                Suggested next
              </p>
              <p className="mt-1 font-display text-sm font-semibold leading-tight">
                {suggestedNode.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {suggestedNode.match}% match · {suggestedNode.duration}
              </p>
              <Button size="sm" className="mt-3 w-full" onClick={() => navigate("/roadmap")}>
                Continue <ArrowRight className="size-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stat row */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile icon={Flame} value={userProfile.stats?.streak?.toString() || "0"} label="Day streak" hint="Longest yet" tone="warning" />
        <StatTile icon={TrendingUp} value={`${completion}%`} label="Path complete" tone="primary" />
        <StatTile
          icon={Clock}
          value={`~${weeksLeft} wks`}
          label="Est. time left"
          hint={`at ${hours} hrs/wk`}
          tone="muted"
        />
      </div>

      {/* Skill gap (Radar ⇄ Gap bars) + Insights + Learner Profile + Next actions */}
      <div className="mb-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 shrink-0">
            <div>
              <CardTitle className="text-base">Skill Assessment</CardTitle>
              <p className="text-xs text-muted-foreground">{track.label} profile vs required gaps</p>
            </div>
          </CardHeader>
          <CardContent className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start p-6">
            
            {/* Left side: Normal Radar Map */}
            <div className="w-full flex-col flex items-center justify-start min-h-[300px]">
              <h3 className="mb-2 font-display text-sm font-semibold text-muted-foreground self-start">Overall Profile</h3>
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={track.skillData} outerRadius="70%">
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                    <Radar name="Current" dataKey="current" stroke="#0ea5a4" fill="#0ea5a4" fillOpacity={0.28} />
                    <Radar name="Target" dataKey="target" stroke="#5b5fef" fill="#5b5fef" fillOpacity={0.1} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right side: Specific Skill Gaps */}
            <div className="w-full flex-col flex justify-start pt-2 min-h-[300px]">
              <h3 className="mb-4 font-display text-sm font-semibold text-muted-foreground">Specific Skill Gaps</h3>
              <SkillGapBars track={track} />
            </div>

          </CardContent>
        </Card>

        <div className="flex flex-col gap-5">
          <LearnerProfileCard userProfile={userProfile} />
          <NextActionsCard track={track} suggestedNode={suggestedNode} navigate={navigate} />
        </div>
      </div>

      {/* Career Sim + Milestones/Heatmap */}
      {/* Optimized render cycle */}
      <div className="grid gap-5 lg:grid-cols-2">
        <CareerSimPanel />
        <div className="flex flex-col gap-5">
          <MilestoneTimeline track={track} />
          <ActivityHeatmap className="flex-1" />
        </div>
      </div>
    </div>
  );
}
