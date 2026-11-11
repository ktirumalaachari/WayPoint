import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  GitFork,
  ArrowRight,
  Layers,
  Zap,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { MOCK_PATHS } from "@/data/tracks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function MiniMap({ highlight }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <React.Fragment key={i}>
          <span
            className={cn(
              "size-2.5 rounded-full",
              i <= 1
                ? "bg-primary"
                : highlight
                  ? "bg-warning/70"
                  : "bg-success/60",
            )}
          />
          {i < 4 && <span className="h-px w-4 bg-border" />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function PathSelect() {
  const navigate = useNavigate();
  const { tracks, activeTrackId, setActiveTrackId } = useApp();
  const availablePaths = Object.values(tracks);
  const [selected, setSelected] = React.useState(
    activeTrackId || availablePaths[0]?.id,
  );

  const proceed = () => {
    if (selected) {
      setActiveTrackId(selected);
      navigate("/roadmap");
    }
  };

  const displayPaths = availablePaths.map((track) => {
    const mockPath = MOCK_PATHS.find(
      (m) => m.id === track.id || m.name === track.label,
    );
    const nodes = Object.values(track.nodeMap || {});
    const shared = mockPath?.shared || nodes.slice(0, 3).map((n) => n.title);
    const unique = mockPath?.unique || nodes.slice(3, 6).map((n) => n.title);

    return {
      id: track.id,
      name: track.label,
      desc:
        mockPath?.desc ||
        `A personalized learning path for ${track.label} to get you job-ready.`,
      shared,
      unique,
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 pb-28 sm:px-6">
      <div className="mb-8 text-center">
        <Badge variant="accent" className="mb-3">
          <Sparkles className="size-3.5" /> Your Active Paths
        </Badge>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Choose the direction that fits you
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Select a track below to view and build its roadmap. You can manage
          multiple goals here.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {displayPaths.map((path, idx) => {
          const isSelected = selected === path.id;
          return (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <div
                onClick={() => setSelected(path.id)}
                role="button"
                tabIndex={0}
                className="block h-full w-full text-left outline-none cursor-pointer"
              >
                <Card
                  className={cn(
                    "h-full transition-all",
                    isSelected
                      ? "border-primary shadow-md ring-2 ring-primary/30"
                      : "hover:-translate-y-1 hover:shadow-md",
                  )}
                >
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          "flex size-11 items-center justify-center rounded-xl",
                          idx === 0
                            ? "bg-primary/10 text-primary"
                            : "bg-warning/15 text-warning",
                        )}
                      >
                        {idx === 0 ? (
                          <Layers className="size-5" />
                        ) : (
                          <GitFork className="size-5" />
                        )}
                      </span>
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full border-2 transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {isSelected && <Check className="size-3.5" />}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-semibold">
                      {path.name}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {path.desc}
                    </p>

                    <div className="mt-4">
                      <MiniMap highlight={idx === 1} />
                    </div>

                    <div className="mt-5 space-y-4">
                      <div>
                        <p className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-success">
                          <Check className="size-3.5" /> Shared foundations
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {path.shared.map((s) => (
                            <span
                              key={s}
                              className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-primary">
                          <Zap className="size-3.5" /> Unique to this path
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {path.unique.map((s) => (
                            <span
                              key={s}
                              className="rounded-md border border-primary/25 bg-primary/5 px-2 py-1 text-xs text-foreground"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <Button
          size="lg"
          onClick={proceed}
          className="pointer-events-auto rounded-full px-8 shadow-xl shadow-primary/25"
        >
          View Roadmap <ArrowRight className="size-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
