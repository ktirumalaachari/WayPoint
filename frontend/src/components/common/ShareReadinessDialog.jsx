import * as React from "react";
import { Share2, Copy, Download, CheckCircle2, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  trackReadinessPct,
  trackVerifiedCount,
} from "@/data/tracks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReadinessGauge } from "@/components/common/ReadinessGauge";

function buildSvgCard({ name, role, readiness, verified }) {
  const skills = verified.slice(0, 5);
  const rows = skills
    .map(
      (s, i) =>
        `<text x="48" y="${312 + i * 30}" font-family="Inter,sans-serif" font-size="15" fill="#e7e8f0">✓ ${s.skill}</text>`
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#171922"/><stop offset="1" stop-color="#0e0f14"/>
    </linearGradient>
    <linearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5b5fef"/><stop offset="1" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="640" height="480" rx="24" fill="url(#bg)"/>
  <rect x="1" y="1" width="638" height="478" rx="23" fill="none" stroke="#2a2e3d"/>
  <text x="48" y="70" font-family="Outfit,sans-serif" font-size="26" font-weight="700" fill="#fff">WayPoint</text>
  <text x="48" y="98" font-family="Inter,sans-serif" font-size="14" fill="#9ba0b5">Career Readiness Report</text>
  <circle cx="500" cy="130" r="70" fill="none" stroke="#21242f" stroke-width="16"/>
  <circle cx="500" cy="130" r="70" fill="none" stroke="url(#arc)" stroke-width="16" stroke-linecap="round"
    stroke-dasharray="${2 * Math.PI * 70}" stroke-dashoffset="${2 * Math.PI * 70 * (1 - readiness / 100)}"
    transform="rotate(-90 500 130)"/>
  <text x="500" y="140" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="34" font-weight="700" fill="#fff">${readiness}%</text>
  <text x="48" y="200" font-family="Inter,sans-serif" font-size="14" fill="#9ba0b5">Candidate</text>
  <text x="48" y="226" font-family="Outfit,sans-serif" font-size="22" font-weight="600" fill="#fff">${name}</text>
  <text x="48" y="262" font-family="Inter,sans-serif" font-size="14" fill="#9ba0b5">Target role</text>
  <text x="48" y="286" font-family="Outfit,sans-serif" font-size="18" font-weight="600" fill="#6e72f0">${role}</text>
  ${rows}
  <text x="48" y="452" font-family="Inter,sans-serif" font-size="12" fill="#6b6f87">Verified via skill assessment · waypoint.app</text>
</svg>`;
}

export function ShareReadinessDialog({ trigger }) {
  const { activeTrack, userProfile } = useApp();
  const [copied, setCopied] = React.useState(false);

  if (!activeTrack) return null;

  const readiness = trackReadinessPct(activeTrack);
  const verifiedCount = trackVerifiedCount(activeTrack);
  const verified = activeTrack.skillData.filter(
    (s) => s.current / s.target >= 0.75
  );
  const role = userProfile.targetRole || activeTrack.label;

  const summary = `🎯 WayPoint Career Readiness\n${userProfile.name} — ${role}\nReadiness: ${readiness}% · ${verifiedCount} verified skills\nVerified: ${verified.map((s) => s.skill).join(", ") || "—"}`;

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const downloadCard = () => {
    const svg = buildSvgCard({
      name: userProfile.name,
      role,
      readiness,
      verified,
    });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waypoint-readiness-${userProfile.name.toLowerCase().replace(/\s+/g, "-")}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="size-4" />
            Share readiness
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Shareable readiness card</DialogTitle>
          <DialogDescription>
            A clean, recruiter-facing snapshot of your verified progress.
          </DialogDescription>
        </DialogHeader>

        {/* Preview card */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-secondary/60 to-card p-5">
          <div className="flex items-center gap-4">
            <ReadinessGauge value={readiness} size={110} strokeWidth={9} animate={false} label="" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Candidate</p>
              <p className="font-display text-lg font-semibold text-foreground">
                {userProfile.name}
              </p>
              <p className="truncate text-sm font-medium text-primary">{role}</p>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {verifiedCount} verified skills
            </p>
            {verified.slice(0, 4).map((s) => (
              <div key={s.skill} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-success" />
                {s.skill}
              </div>
            ))}
            {verified.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Complete a skill check to verify skills.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={copySummary}>
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            {copied ? "Copied!" : "Copy summary"}
          </Button>
          <Button className="flex-1" onClick={downloadCard}>
            <Download className="size-4" />
            Download card
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareReadinessDialog;
