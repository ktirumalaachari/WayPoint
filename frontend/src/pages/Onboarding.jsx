import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Mic,
  MicOff,
  Check,
  Loader2,
  Pencil,
  Clock,
  Target,
  GraduationCap,
  Brain,
  Send,
  MessageCircle,
  Search,
  Plus,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api } from "@/services/api";
import { SUPPORTED_ROLES } from "@/data/tracks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STEPS = ["Profile Basics", "AI Context", "Confirmation"];
const LEVELS = [
  { id: "beginner", label: "Beginner", desc: "New to this field" },
  { id: "intermediate", label: "Intermediate", desc: "Some hands-on experience" },
  { id: "advanced", label: "Advanced", desc: "Comfortable, filling gaps" },
];
// Quick-select presets under the weekly-time slider.
const TIME_PRESETS = [
  { h: 3, label: "Casual" },
  { h: 6, label: "Steady" },
  { h: 10, label: "Focused" },
  { h: 15, label: "Intensive" },
];

/* ─── Web Speech API voice input ─── */
function useSpeechInput(onResult) {
  const [listening, setListening] = React.useState(false);
  const recognitionRef = React.useRef(null);
  const supported =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const toggle = React.useCallback(() => {
    if (!supported) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
      onResult(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening, onResult, supported]);

  React.useEffect(() => () => recognitionRef.current?.stop(), []);

  return { supported: !!supported, listening, toggle };
}

function ProgressRing({ step }) {
  const percentage = step === 0 ? 33 : step === 1 ? 66 : 100;
  const radius = 20; // Increased slightly from 18
  const stroke = 3;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <>
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="-rotate-90">
          <circle
            className="text-muted/30"
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <motion.circle
            className="text-primary"
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-foreground">{percentage}</span>
        </div>
      </div>
      <div className="flex flex-col pr-1">
        <span className="text-[10px] font-bold leading-none text-muted-foreground uppercase tracking-wider">
          Profile
        </span>
        <span className="text-xs font-semibold leading-none text-foreground mt-0.5">
          {percentage}% Complete
        </span>
      </div>
    </>
  );
}

function Stepper({ step }) {
  return (
    <div className="mx-auto mb-10 flex max-w-md items-center">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                i < step && "bg-success text-success-foreground",
                i === step && "bg-primary text-primary-foreground",
                i > step && "bg-secondary text-muted-foreground"
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "whitespace-nowrap text-xs font-medium",
                i === step ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "mx-2 mb-5 h-0.5 flex-1 rounded-full transition-colors",
                i < step ? "bg-success" : "bg-border"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function ChatBubble({ message, isUser }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex gap-2.5", isUser && "flex-row-reverse")}
    >
      {!isUser && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <Sparkles className="size-3.5" />
        </span>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-secondary text-foreground"
        )}
      >
        {message}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2.5"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
        <Sparkles className="size-3.5" />
      </span>
      <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-muted-foreground/50"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { userProfile, setUserProfile, setActiveTrackId, tracks, showToast } = useApp();

  const [step, setStep] = React.useState(0);
  const [role, setRole] = React.useState("ml");
  const [level, setLevel] = React.useState("beginner");
  const [hours, setHours] = React.useState(userProfile.weeklyTimeHours || 6);
  const [saving, setSaving] = React.useState(false);

  const [roleSearch, setRoleSearch] = React.useState("");
  const [customRoles, setCustomRoles] = React.useState([]);

  const ALL_ROLES = React.useMemo(
    () => [...SUPPORTED_ROLES, ...customRoles].sort((a, b) => a.label.localeCompare(b.label)),
    [customRoles]
  );
  const filteredRoles = ALL_ROLES.filter((r) =>
    r.label.toLowerCase().includes(roleSearch.toLowerCase())
  );

  // ─── Chat State ───
  const [chatMessages, setChatMessages] = React.useState([]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatLoading, setChatLoading] = React.useState(false);
  const [extractedProfile, setExtractedProfile] = React.useState(null);
  const chatEndRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const roleMeta = React.useMemo(
    () => ALL_ROLES.find((r) => r.id === role) || ALL_ROLES[0],
    [ALL_ROLES, role]
  );

  // Voice input for chat
  const { supported: voiceSupported, listening, toggle: toggleVoice } = useSpeechInput((t) =>
    setChatInput((prev) => (prev ? `${prev} ${t}` : t))
  );

  // Auto-scroll chat to bottom
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // When user enters Step 1, send initial empty message to get the AI greeting
  const chatInitialized = React.useRef(false);
  React.useEffect(() => {
    if (step === 1 && !chatInitialized.current && chatMessages.length === 0) {
      chatInitialized.current = true;
      (async () => {
        setChatLoading(true);
        try {
          const res = await api.onboardingChat([], role);
          if (res.success && !res.done) {
            setChatMessages([{ role: "assistant", content: res.message }]);
          }
        } catch (err) {
          console.error("Chat init failed:", err);
          setChatMessages([{
            role: "assistant",
            content: "Hey! 🚀 So tell me, what are you currently doing — college, job, or self-learning?",
          }]);
        } finally {
          setChatLoading(false);
        }
      })();
    }
  }, [step, chatMessages.length, role]);

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const newMessages = [...chatMessages, { role: "user", content: text }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await api.onboardingChat(newMessages, role);
      if (res.success) {
        if (res.done) {
          // AI is done — extract profile and move to review
          const profile = res.profile || {};
          setExtractedProfile(profile);
          // Auto-advance to step 2 after a brief moment
          setChatMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Awesome! 🎉 I've got a good understanding of your profile. Let's review it!",
            },
          ]);
          setTimeout(() => setStep(2), 1500);
        } else {
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", content: res.message },
          ]);
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Oops, something went wrong. Please try again!",
        },
      ]);
    } finally {
      setChatLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  // Build final profile data for confirm
  const finalProfile = React.useMemo(() => {
    const ep = extractedProfile || {};
    
    let parsedHours = hours;
    if (ep.weeklyTimeHours) {
      const match = String(ep.weeklyTimeHours).match(/\d+/);
      if (match) parsedHours = parseInt(match[0], 10);
    }

    return {
      name: userProfile?.name || "Learner",
      targetRole: roleMeta?.label || "Machine Learning",
      skillLevel: ep.skillLevel || level,
      weeklyTimeHours: parsedHours,
      learningStyle: ep.learningStyle || "mixed",
      pastExperience: ep.pastExperience || "Not specified",
      careerGoals: ep.careerGoals || "",
      detailedContext: ep.detailedContext || {},
    };
  }, [extractedProfile, userProfile, roleMeta, level, hours]);

  const confirm = async () => {
    setSaving(true);
    try {
      const res = await api.submitOnboarding(finalProfile);
      if (res.success) {
        setUserProfile((p) => ({ ...p, ...res.profile, ...finalProfile }));
        setActiveTrackId(role);
        showToast("Profile saved", { description: "Let's verify your skills next." });
        navigate("/skill-check");
      }
    } catch (error) {
      console.error("Onboarding submit failed:", error);
      showToast("Setup Failed", { 
        description: error.message || "Failed to save profile.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-10 sm:px-6">
      
      {/* For Step 0: The Full Cohesive Glassmorphism Header */}
      {step === 0 && (
        <div className="sticky top-14 md:top-16 z-40 -mx-4 px-4 pt-4 pb-8 mb-2 sm:-mx-6 sm:px-6">
          
          {/* Seamless Fade Blur Background (Square edges removed) */}
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 [mask-image:linear-gradient(to_bottom,black_70%,transparent)] pointer-events-none -z-10" />
          
          <div className="relative mb-6 text-center w-full flex flex-col justify-center">
            <Badge variant="accent" className="mb-3 mx-auto">
              <Sparkles className="size-3.5" /> Let's personalize your path
            </Badge>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Tell WayPoint about your goal
            </h1>

            {/* Progress Bar aligned to the right within the header */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex justify-end pointer-events-none hidden sm:flex">
              <div className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-border/50 bg-background/90 backdrop-blur-md px-4 py-2 shadow-sm">
                <ProgressRing step={step} />
              </div>
            </div>
          </div>

          {/* 1-2-3 Stepper shifted up closer to the title */}
          <Stepper step={step} />
          
          {/* Mobile Progress Bar (visible only on small screens) */}
          <div className="mt-4 flex sm:hidden justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-border/50 bg-card px-4 py-2 shadow-sm">
              <ProgressRing step={step} />
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ─── STEP 0: Form — one card per question so it reads broad, not cramped ─── */}
        {step === 0 && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              {/* Target role */}
              <Card>
                <CardContent className="p-6">
                  <Label className="mb-2 flex items-center gap-1.5">
                    <Target className="size-4 text-primary" /> Target role
                  </Label>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Where do you want to be job-ready? Search or add any role/skill.
                  </p>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search or add a role..."
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-2 pb-1">
                    {filteredRoles.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={cn(
                          "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                          role === r.id
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-card hover:bg-accent"
                        )}
                      >
                        <span className="mr-1">{r.icon}</span>
                        {r.label}
                      </button>
                    ))}
                    {filteredRoles.length === 0 && (
                      <div className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-4">
                        <p className="text-xs text-muted-foreground">No matching role found</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            if (!roleSearch.trim()) return;
                            const rawLabel = roleSearch.trim();
                            const knownCasing = {
                              'ai': 'AI', 'aws': 'AWS', 'ui': 'UI', 'ux': 'UX', 'ui/ux': 'UI/UX',
                              'openai': 'OpenAI', 'api': 'API', 'ml': 'ML', 'llm': 'LLM',
                              'js': 'JS', 'javascript': 'JavaScript', 'typescript': 'TypeScript',
                              'nodejs': 'Node.js', 'node.js': 'Node.js', 'reactjs': 'ReactJS',
                              'nextjs': 'Next.js', 'gcp': 'GCP', 'php': 'PHP', 'html': 'HTML',
                              'css': 'CSS', 'sql': 'SQL', 'mysql': 'MySQL', 'postgresql': 'PostgreSQL'
                            };
                            const formattedLabel = rawLabel.split(' ').map(word => {
                              const w = word.toLowerCase();
                              if (knownCasing[w]) return knownCasing[w];
                              if (word.substring(1).match(/[A-Z]/)) return word;
                              let formatted = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                              formatted = formatted.replace(/ai$/i, 'AI');
                              formatted = formatted.replace(/api$/i, 'API');
                              formatted = formatted.replace(/ml$/i, 'ML');
                              formatted = formatted.replace(/db$/i, 'DB');
                              formatted = formatted.replace(/ui$/i, 'UI');
                              formatted = formatted.replace(/ux$/i, 'UX');
                              formatted = formatted.replace(/js$/i, 'JS');
                              return formatted;
                            }).join(' ');
                            const getDynamicIcon = (lbl) => {
                              const lw = lbl.toLowerCase();
                              if (lw.includes('react') || lw.includes('mern')) return '⚛️';
                              if (lw.includes('java') && !lw.includes('javascript')) return '☕';
                              if (lw.includes('javascript') || lw.includes('js')) return 'JS';
                              if (lw.includes('python')) return '🐍';
                              if (lw.includes('cloud') || lw.includes('aws') || lw.includes('azure') || lw.includes('gcp')) return '☁️';
                              if (lw.includes('data') || lw.includes('sql') || lw.includes('analy')) return '📊';
                              if (lw.includes('design') || lw.includes('ui') || lw.includes('ux')) return '🎨';
                              if (lw.includes('web') || lw.includes('front') || lw.includes('back') || lw.includes('html') || lw.includes('css')) return '🌐';
                              if (lw.includes('ai') || lw.includes('machine') || lw.includes('deep') || lw.includes('llm')) return '🤖';
                              if (lw.includes('sec') || lw.includes('hack') || lw.includes('cyber')) return '🛡️';
                              if (lw.includes('app') || lw.includes('mobile') || lw.includes('android') || lw.includes('ios')) return '📱';
                              if (lw.includes('game')) return '🎮';
                              if (lw.includes('block') || lw.includes('crypto') || lw.includes('web3')) return '⛓️';
                              return '✨';
                            };
                            const newRole = {
                              id: rawLabel.toLowerCase().replace(/\s+/g, '-'),
                              label: formattedLabel,
                              icon: getDynamicIcon(rawLabel)
                            };
                            if (!ALL_ROLES.some(r => r.id === newRole.id)) {
                              setCustomRoles(prev => [...prev, newRole]);
                            }
                            setRole(newRole.id);
                            setRoleSearch("");
                          }}
                        >
                          <Plus className="mr-1 size-3" /> Add Your Skill
                        </Button>
                      </div>
                    )}
                  </div>
                  {!tracks[role] && (
                    <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="size-3 text-primary" /> A tailored roadmap will be generated dynamically.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Current level */}
              <Card>
                <CardContent className="p-6">
                  <Label className="mb-1 flex items-center gap-1.5">
                    <GraduationCap className="size-4 text-primary" /> Current level
                  </Label>
                  <p className="mb-3 text-xs text-muted-foreground">
                    So we start at the right depth.
                  </p>
                  <div className="grid gap-2">
                    {LEVELS.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setLevel(l.id)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border p-3 text-left transition-colors",
                          level === l.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border bg-card hover:bg-accent"
                        )}
                      >
                        <div>
                          <div className="text-sm font-semibold">{l.label}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{l.desc}</div>
                        </div>
                        {level === l.id && <Check className="size-4 shrink-0 text-primary" />}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly time budget — its own card with slider + quick presets */}
            <Card>
              <CardContent className="p-5">
                <div className="mb-2.5 flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    <Clock className="size-4 text-primary" /> Weekly time budget
                  </Label>
                  <span className="font-mono text-sm font-semibold">{hours} hrs/wk</span>
                </div>
                <Slider value={[hours]} min={2} max={20} step={1} onValueChange={(v) => setHours(v[0])} className="my-3" />
                <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                  <span>2h · casual</span>
                  <span>20h · intensive</span>
                </div>
                {/* Quick-select presets — compact inline chips */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {TIME_PRESETS.map((p) => (
                    <button
                      key={p.h}
                      onClick={() => setHours(p.h)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
                        hours === p.h
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card hover:bg-accent"
                      )}
                    >
                      <span className="font-mono font-semibold">{p.h}h</span>
                      <span
                        className={cn(
                          hours === p.h ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}
                      >
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button size="lg" className="px-10 rounded-full text-base font-semibold shadow-sm hover:shadow-md transition-all active:scale-95" onClick={() => setStep(1)}>
                    Continue <ArrowRight className="ml-2 size-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── STEP 1: AI Chat ─── */}
        {step === 1 && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mx-auto max-w-3xl pt-2 sm:pt-4"
          >
            <Card className="overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/5 to-card px-3 sm:px-5 py-2.5 sm:py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <MessageCircle className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">WayPoint AI Coach</p>
                  <p className="text-xs text-muted-foreground truncate hidden sm:block">
                    {roleMeta?.icon} {roleMeta?.label} · Chat to build your profile
                  </p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1.5 mr-1">
                    <span className="size-2 animate-pulse rounded-full bg-success" />
                    <span className="text-[10px] font-medium text-success">Online</span>
                  </div>
                  {/* Progress Ring securely embedded in the chat header */}
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/90 px-3 py-1.5 shadow-sm">
                    <ProgressRing step={step} />
                  </div>
                </div>
              </div>

              <CardContent className="p-0">
                {/* Chat messages */}
                <div className="h-[50vh] min-h-[300px] max-h-[380px] overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
                  {chatMessages.map((msg, i) => (
                    <ChatBubble key={i} message={msg.content} isUser={msg.role === "user"} />
                  ))}
                  {chatLoading && <TypingIndicator />}
                  <div ref={chatEndRef} />
                </div>

                {/* Input area */}
                <div className="border-t border-border bg-card/50 px-4 py-3">
                  <div className="flex items-end gap-2">
                    <div className="relative flex-1">
                      <textarea
                        ref={inputRef}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        placeholder="Type your message... 🎤"
                        className="w-full resize-none rounded-xl border border-input bg-background px-4 py-2.5 pr-12 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
                        style={{ minHeight: "42px", maxHeight: "100px" }}
                        onInput={(e) => {
                          e.target.style.height = "42px";
                          e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                        }}
                      />
                      {voiceSupported && (
                        <button
                          type="button"
                          onClick={toggleVoice}
                          className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-lg transition-colors",
                            listening
                              ? "bg-destructive/10 text-destructive"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                        </button>
                      )}
                    </div>
                    <Button
                      size="icon"
                      onClick={sendChatMessage}
                      disabled={!chatInput.trim() || chatLoading}
                      className="size-[42px] shrink-0 rounded-xl"
                    >
                      <Send className="size-4" />
                    </Button>
                  </div>
                  {listening && (
                    <span className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
                      <span className="size-2 animate-pulse rounded-full bg-destructive" />
                      Listening…
                    </span>
                  )}
                </div>

                {/* Back button */}
                <div className="border-t border-border px-4 py-3">
                  <Button variant="outline" onClick={() => setStep(0)}>
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── STEP 2: Summary ─── */}
        {step === 2 && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mx-auto max-w-3xl pt-2 sm:pt-4"
          >
            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
                      <Brain className="size-4" />
                    </span>
                    <h2 className="font-display text-lg font-semibold">Your profile</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                      <Pencil className="size-3.5 mr-1.5" /> Edit
                    </Button>
                    {/* Progress Ring securely embedded in the summary header */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/90 px-3 py-1.5 shadow-sm">
                      <ProgressRing step={step} />
                    </div>
                  </div>
                </div>

                <dl className="divide-y divide-border rounded-xl border border-border">
                  {[
                    { label: "Target role", value: `${roleMeta?.icon} ${roleMeta?.label}` },
                    {
                      label: "Current level",
                      value: LEVELS.find((l) => l.id === (finalProfile.skillLevel || level))?.label || finalProfile.skillLevel,
                    },
                    { label: "Weekly time", value: `${finalProfile.weeklyTimeHours} hrs / week` },
                    { label: "Learning style", value: finalProfile.learningStyle?.replace("-", " ") || "—" },
                    { label: "Past experience", value: finalProfile.pastExperience || "Not specified" },
                    { label: "Career goals", value: finalProfile.careerGoals || "Not specified" },
                    ...(finalProfile.detailedContext?.education
                      ? [{ label: "Education", value: finalProfile.detailedContext.education }]
                      : []),
                    ...(finalProfile.detailedContext?.strengths
                      ? [{ label: "Strengths", value: finalProfile.detailedContext.strengths }]
                      : []),
                    ...(finalProfile.detailedContext?.weaknesses
                      ? [{ label: "Areas to improve", value: finalProfile.detailedContext.weaknesses }]
                      : []),
                    ...(finalProfile.detailedContext?.dreamCompany
                      ? [{ label: "Dream company", value: finalProfile.detailedContext.dreamCompany }]
                      : []),
                  ].map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-3">
                      <dt className="text-sm text-muted-foreground">{row.label}</dt>
                      <dd className="max-w-[60%] text-right text-sm font-medium">{row.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                  <Button className="flex-1" size="lg" disabled={saving} onClick={confirm}>
                    {saving && <Loader2 className="size-4 animate-spin" />}
                    Looks good — verify my skills <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
