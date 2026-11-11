import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  ShieldCheck,
  RotateCcw,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api } from "@/services/api";
import {
  QUIZ_QUESTIONS,
  TRACKS,
} from "@/data/tracks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ReadinessGauge } from "@/components/common/ReadinessGauge";
import { SkillStatusCard } from "@/components/common/SkillStatusCard";
import { cn } from "@/lib/utils";

export default function FinalAssessment() {
  const navigate = useNavigate();
  const { activeTrackId, tracks, userProfile, refreshTracks } = useApp();

  const quizRole = activeTrackId || "ml";
  const [questions, setQuestions] = React.useState(null);
  const track = tracks[quizRole] || Object.values(tracks)[0] || TRACKS[quizRole] || TRACKS['ml'];

  const [current, setCurrent] = React.useState(0);
  const [answers, setAnswers] = React.useState([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [showAnalysis, setShowAnalysis] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;
    async function loadQuiz() {
      try {
        const skillLevel = userProfile?.skillLevel || 'beginner';
        const res = await api.getQuiz(quizRole, skillLevel, 'final');
        if (!ignore) {
          if (res.success) {
            setQuestions(res.questions);
            setAnswers(Array(res.questions.length).fill(null));
          } else {
            const fallback = QUIZ_QUESTIONS[quizRole] || QUIZ_QUESTIONS['ml'];
            setQuestions(fallback);
            setAnswers(Array(fallback.length).fill(null));
          }
        }
      } catch {
        if (!ignore) {
          // Fallback to static if backend fails
          const fallback = QUIZ_QUESTIONS[quizRole] || QUIZ_QUESTIONS['ml'];
          setQuestions(fallback);
          setAnswers(Array(fallback.length).fill(null));
        }
      }
    }
    loadQuiz();
    return () => {
      ignore = true;
    };
  }, [quizRole, userProfile?.skillLevel]);

  if (!questions) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Generating personalized skill check...</p>
      </div>
    );
  }

  const q = questions[current];
  const selected = answers[current] ?? null;
  const answeredCount = answers.filter((a) => a !== null && a !== undefined).length;
  const isLast = current === questions.length - 1;

  const choose = (i) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = i;
      return next;
    });
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await api.submitQuiz(quizRole, answers, 'final');
      if (res.success) {
        setResult(res);
        // Re-fetch tracks so Dashboard reflects the updated skill levels
        await refreshTracks();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    if (questions) setAnswers(Array(questions.length).fill(null));
    setCurrent(0);
    setResult(null);
    setShowAnalysis(false);
  };

  /* ─── Reveal ─── */
  if (result && track) {
    const isPass = result.correct_count >= 12;
    const v = isPass 
      ? { label: "Pass! You are Job-Ready", tone: "text-success" }
      : { label: "Fail — More Preparation Needed", tone: "text-destructive" };

    if (showAnalysis) {
      return (
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  Detailed Test Analysis
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Review your answers and learn from your mistakes.
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowAnalysis(false)}>
                <ArrowLeft className="mr-2 size-4" /> Back to results
              </Button>
            </div>

            {!result.results ? (
              <div className="mt-8 rounded-xl border p-6 text-center text-sm text-muted-foreground">
                Detailed analysis is not available for this test session. Please retake the test.
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                {result.results.map((res, i) => (
                <Card key={i} className={cn("overflow-hidden border-l-4", res.is_correct ? "border-l-success" : "border-l-destructive")}>
                  <CardContent className="p-5">
                    <p className="font-medium text-sm mb-4">Q{i + 1}: {res.q}</p>
                    <div className="space-y-2.5">
                      {res.options.map((opt, optIdx) => {
                        const isCorrectOpt = res.correct_answer === optIdx;
                        const isUserSelected = res.user_answer === optIdx;
                        
                        let optionClass = "border-border bg-card text-muted-foreground";
                        let Icon = null;
                        
                        if (isCorrectOpt) {
                          optionClass = "border-success bg-success/10 text-foreground ring-1 ring-success/30 font-medium";
                          Icon = Check;
                        } else if (isUserSelected && !isCorrectOpt) {
                          optionClass = "border-destructive bg-destructive/10 text-foreground ring-1 ring-destructive/30";
                          Icon = X;
                        }

                        return (
                          <div key={optIdx} className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-sm", optionClass)}>
                            <span className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                              isCorrectOpt ? "border-success bg-success text-success-foreground" :
                              isUserSelected ? "border-destructive bg-destructive text-destructive-foreground" : "border-border"
                            )}>
                              {Icon ? <Icon className="size-3" /> : String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className={cn((isCorrectOpt || isUserSelected) && "font-medium")}>{opt}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
            <div className="mt-8 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAnalysis(false)}>
                Back to results
              </Button>
              <Button onClick={() => navigate("/dashboard")}>
                Return to Dashboard <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Badge variant={isPass ? "success" : "destructive"} className="mb-4">
            <ShieldCheck className="size-3.5" /> Capstone Result
          </Badge>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {isPass ? "Congratulations!" : "Not Quite There Yet"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isPass 
              ? "You have successfully passed the capstone assessment." 
              : "You should study more. If you want to change the roadmap you can do that, otherwise keep it the same."}
          </p>
        </motion.div>

        <Card className="mt-8 overflow-hidden">
          <CardContent className="flex flex-col items-center gap-8 p-8 sm:flex-row sm:items-center sm:justify-center sm:gap-12">
            <ReadinessGauge value={result.readiness_score} size={200} label="Score" />
            <div className="max-w-xs text-center sm:text-left">
              <p className={cn("font-display text-xl font-semibold", v.tone)}>{v.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                You answered{" "}
                <span className="font-mono font-semibold text-foreground">
                  {result.correct_count}/{result.total_count}
                </span>{" "}
                correctly. (12 correct needed to pass).
              </p>
            </div>
          </CardContent>
        </Card>

        <h2 className="mb-3 mt-8 font-display text-lg font-semibold">Skill breakdown</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {track.skillData.map((s, i) => (
            <motion.div
              key={s.skill}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <SkillStatusCard skill={s.skill} current={s.current} target={s.target} />
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={restart}>
            <RotateCcw className="size-4" /> Retake
          </Button>
          {!isPass && (
            <Button variant="outline" onClick={() => navigate("/roadmap")}>
              Change Roadmap
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowAnalysis(!showAnalysis)}>
            {showAnalysis ? "Hide analysis" : "Analyze your test"}
          </Button>
          <Button size="lg" className="flex-1" onClick={() => navigate("/dashboard")}>
            Return to Dashboard <ArrowRight className="size-4" />
          </Button>
        </div>


      </div>
    );
  }

  /* ─── Quiz ─── */
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 text-center">
        <Badge variant="accent" className="mb-3">
          <Sparkles className="size-3.5" /> Final Assessment · {track?.label}
        </Badge>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Capstone Exam
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {questions.length} questions — let's verify how much you've learned.
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">
          Question {current + 1} of {questions.length}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {answeredCount}/{questions.length} answered
        </span>
      </div>
      <Progress value={((current + 1) / questions.length) * 100} className="mb-6" />

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
        >
          <Card>
            <CardContent className="p-6">
              <p className="font-display text-lg font-medium leading-snug">{q.q}</p>
              <div className="mt-5 space-y-2.5">
                {q.options.map((opt, i) => {
                  const active = selected === i;
                  return (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all",
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-primary/40 hover:bg-accent"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {active ? <Check className="size-3.5" /> : String.fromCharCode(65 + i)}
                      </span>
                      <span className={cn(active && "font-medium")}>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex gap-2">
        <Button
          variant="outline"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>
        {isLast ? (
          <Button
            className="flex-1"
            size="lg"
            disabled={answeredCount < questions.length || submitting}
            onClick={submit}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Scoring…" : "See my readiness"}
          </Button>
        ) : (
          <Button
            className="flex-1"
            size="lg"
            disabled={selected === null}
            onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
          >
            Next <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
