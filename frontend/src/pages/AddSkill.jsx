import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Search, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SUPPORTED_ROLES } from "@/data/tracks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AddSkill() {
  const navigate = useNavigate();
  const { tracks, setActiveTrackId } = useApp();
  const [role, setRole] = React.useState("");
  const [search, setSearch] = React.useState("");

  const filtered = SUPPORTED_ROLES.filter((r) =>
    r.label.toLowerCase().includes(search.toLowerCase())
  );

  const proceed = () => {
    if (!role) return;
    setActiveTrackId(role);
    navigate("/skill-check");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl px-4 py-12 sm:px-6"
    >
      <Badge variant="accent" className="mb-3">
        <Sparkles className="size-3.5" /> Add a new skill
      </Badge>
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        What do you want to get ready for next?
      </h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
        This creates a brand-new, independent roadmap and radar — your existing tracks are never
        touched. We reuse your time budget and learning style, so it's just a quick skill check away.
      </p>

      <Card className="mt-7">
        <CardContent className="p-6">
          <div className="relative mb-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search roles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filtered.map((r) => {
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card hover:bg-accent"
                  )}
                >
                  <span>{r.icon}</span>
                  {r.label}
                  {active && <Check className="size-3.5" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-2 text-sm text-muted-foreground">No roles match “{search}”.</p>
            )}
          </div>

          {role && !tracks[role] && (
            <p className="mt-4 text-xs text-muted-foreground">
              A tailored roadmap for this role is generated right after your skill check.
            </p>
          )}
        </CardContent>
      </Card>

      <Button size="xl" className="mt-6 w-full" disabled={!role} onClick={proceed}>
        Continue to quick skill check <ArrowRight className="size-4" />
      </Button>
    </motion.div>
  );
}
