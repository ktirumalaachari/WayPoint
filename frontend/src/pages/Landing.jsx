import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  ArrowRight,
  ShieldCheck,
  Radar,
  Route as RouteIcon,
  Sparkles,
  Share2,
  Gauge,
  CheckCircle2,
  Star,
  ChevronDown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SUPPORTED_ROLES } from "@/data/tracks";
import FloatingNav from "@/components/layout/FloatingNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ReadinessGauge } from "@/components/common/ReadinessGauge";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const STEPS = [
  {
    icon: ShieldCheck,
    tone: "text-success bg-success/12",
    title: "Verify",
    desc: "A short, role-specific quiz turns self-declared skills into evidence — we don't just take your word for it.",
  },
  {
    icon: Radar,
    tone: "text-primary bg-primary/10",
    title: "Diagnose",
    desc: "See exactly where you stand vs your target role on a live skill-gap radar, with your weak spots ranked.",
  },
  {
    icon: RouteIcon,
    tone: "text-warning bg-warning/15",
    title: "Build & Prove",
    desc: "Get an adaptive Learn → Build → Prove roadmap that re-plans around your pace, time, and feedback.",
  },
];

const FEATURES = [
  { icon: ShieldCheck, title: "Skill verification", desc: "Evidence-based readiness from real assessments, not course-completion %." },
  { icon: RouteIcon, title: "Adaptive roadmap", desc: "Flow & module views. Nothing is locked — an AI 'suggested next' guides you." },
  { icon: Sparkles, title: "AI explanations", desc: "Ask why any node is on your path. Get reasoning, prerequisites, and time-fit." },
  { icon: Radar, title: "Skill-gap radar", desc: "Current vs target across every skill, updated as you complete work." },
  { icon: Gauge, title: "Career simulation", desc: "Drag your weekly hours and watch readiness + time-to-goal recompute live." },
  { icon: Share2, title: "Shareable readiness", desc: "Export a clean, recruiter-facing snapshot of your verified progress." },
];

const STATS = [
  { value: "5", label: "Career tracks" },
  { value: "Learn·Build·Prove", label: "Every roadmap" },
  { value: "Evidence-based", label: "Readiness score" },
  { value: "Adaptive", label: "AI re-planning" },
];

const NAV_LINKS = [
  { href: "#tracks", label: "Tracks" },
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

const FAQS = [
  {
    q: "How is a readiness score different from course-completion %?",
    a: "Course platforms reward you for finishing videos. WayPoint scores you on demonstrated skill — a short, role-specific assessment verifies what you actually know, so the number reflects real readiness, not watch-time.",
  },
  {
    q: "Do I have to follow the roadmap in a fixed order?",
    a: "No — nothing is locked. Every node is open from day one; an AI 'suggested next' just points to the highest-leverage step. Give feedback (too easy / too hard / skip) and only your future path re-plans.",
  },
  {
    q: "Which career tracks are supported?",
    a: "Eight and growing — Machine Learning, Java Backend, MERN, DevOps, Cloud, UI/UX, Data Analytics and Cybersecurity. Each has its own independent roadmap, radar and readiness score.",
  },
  {
    q: "Can I share my progress with a recruiter?",
    a: "Yes. Export a clean, recruiter-facing readiness snapshot — verified skills, target role and gauge — as a shareable card, straight from your dashboard.",
  },
];

function LandingHeader() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useApp();
  return (
    <FloatingNav>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex size-8 items-center justify-center rounded-lg shadow-sm overflow-hidden bg-primary text-primary-foreground">
          <img src="/waypoint.svg" alt="WayPoint Logo" className="size-full object-cover" />
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">WayPoint</span>
      </button>

      <nav className="hidden items-center gap-0.5 md:flex">
        {NAV_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {l.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/auth?mode=login")}
          className="hidden sm:inline-flex"
        >
          Log in
        </Button>
        <Button size="sm" onClick={() => navigate("/auth")}>
          Get started
        </Button>
      </div>
    </FloatingNav>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
      >
        <span className="font-display text-base font-semibold">{q}</span>
        <ChevronDown
          className={
            "size-5 shrink-0 text-muted-foreground transition-transform duration-300 " +
            (open ? "rotate-180" : "")
          }
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <LandingHeader />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pt-16">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -top-24 left-1/2 -z-10 size-[520px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
              <Badge variant="accent" className="mb-5">
                <Sparkles className="size-3.5" /> AI Career Readiness
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
            >
              Stop guessing what to learn.{" "}
              <span className="text-gradient">Find out if you're actually ready.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="mt-5 max-w-xl text-lg text-muted-foreground"
            >
              WayPoint verifies your skills, measures the gap to your target role, and builds
              an adaptive roadmap that proves you're job-ready — with evidence, not vibes.
            </motion.p>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button size="xl" onClick={() => navigate("/auth")}>
                Get started free <ArrowRight className="size-4" />
              </Button>
              <Button size="xl" variant="outline" onClick={() => navigate("/dashboard")}>
                See a live demo
              </Button>
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
            >
              {["No credit card", "5 career tracks", "Adaptive to your pace"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-success" /> {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Signature preview card */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="relative"
          >
            <Card className="relative overflow-hidden p-6 shadow-xl">
              <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    Career readiness
                  </p>
                  <p className="font-display text-lg font-semibold">Machine Learning</p>
                </div>
                <Badge variant="success">Evidence-based</Badge>
              </div>
              <div className="my-6 flex justify-center">
                <ReadinessGauge value={71} size={180} label="Ready" />
              </div>
              <div className="space-y-2.5">
                {[
                  { skill: "Python", pct: 82, tone: "bg-success" },
                  { skill: "Statistics", pct: 68, tone: "bg-primary" },
                  { skill: "Machine Learning", pct: 24, tone: "bg-warning" },
                ].map((s) => (
                  <div key={s.skill} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-sm">{s.skill}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className={`h-full rounded-full ${s.tone}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats band ─── */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-xl font-bold text-foreground sm:text-2xl">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Tracks ─── */}
      <section id="tracks" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="accent" className="mb-4">Career tracks</Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Pick a destination — we map the route
          </h2>
          <p className="mt-4 text-muted-foreground">
            Each track is a fully independent roadmap with its own skill-gap radar and
            evidence-based readiness score.
          </p>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {SUPPORTED_ROLES.map((r, i) => (
            <motion.button
              key={r.id}
              onClick={() => navigate("/auth")}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              custom={i % 4}
              className="group flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="text-lg">{r.icon}</span>
              {r.label}
              <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.button>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="accent" className="mb-4">How it works</Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            From "I think I know this" to proven readiness
          </h2>
          <p className="mt-4 text-muted-foreground">
            Three deliberate steps that separate real readiness from a pile of finished courses.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                custom={i}
              >
                <Card className="h-full p-6 transition-shadow hover:shadow-md">
                  <div className="mb-4 flex items-center gap-3">
                    <span className={`flex size-11 items-center justify-center rounded-xl ${step.tone}`}>
                      <Icon className="size-5" />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">STEP {i + 1}</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="scroll-mt-24 border-t border-border bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="accent" className="mb-4">Features</Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to get — and prove — job-ready
            </h2>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-60px" }}
                  custom={i % 3}
                >
                  <Card className="group h-full p-6 transition-all hover:-translate-y-1 hover:shadow-md">
                    <span className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Testimonial ─── */}
      <section id="reviews" className="mx-auto max-w-4xl scroll-mt-24 px-4 py-20 sm:px-6">
        <Card className="relative overflow-hidden p-8 text-center sm:p-12">
          <div className="pointer-events-none absolute -left-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="mb-4 flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-5 fill-warning text-warning" />
            ))}
          </div>
          <p className="relative font-display text-xl font-medium leading-relaxed sm:text-2xl">
            "I finally stopped collecting certificates and started closing real gaps. The readiness
            score told me the truth, and the roadmap adapted every time I got stuck."
          </p>
          <div className="mt-6 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Aarav M.</span> · Career switcher → ML Engineer
          </div>
        </Card>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="scroll-mt-24 border-t border-border bg-card/40 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="accent" className="mb-4">FAQ</Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Questions, answered
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-4 pb-24 pt-20 sm:px-6">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-[#8b5cf6] p-10 text-center shadow-xl sm:p-16">
          <h2 className="font-display text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Ready to find out where you really stand?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
            Take the skill check, get your readiness score, and start a roadmap built around you.
          </p>
          <Button
            size="xl"
            variant="secondary"
            className="mt-8 bg-white text-primary hover:bg-white/90"
            onClick={() => navigate("/auth")}
          >
            Start your assessment <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md overflow-hidden bg-primary text-primary-foreground">
              <img src="/waypoint.svg" alt="WayPoint Logo" className="size-full object-cover" />
            </span>
            <span className="font-display text-sm font-semibold">WayPoint</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Career Readiness & Adaptive Learning · © {new Date().getFullYear()} WayPoint
          </p>
        </div>
      </footer>
    </div>
  );
}
