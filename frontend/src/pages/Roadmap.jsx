import * as React from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Route as RouteIcon,
  GitFork,
  Check,
  Info,
  ChevronDown,
  Lock,
  Loader2,
  Layers,
  BookOpen,
  MessageSquare,
  PlayCircle,
  FileText,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  NODE_ORDER,
  EDGES,
  TREE_BRANCHES,
  suggestedNextId,
  matchColor,
  stageInfo,
  scaleDuration,
} from "@/data/tracks";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* â”€â”€â”€ React Flow custom node â”€â”€â”€ */
function WayPointNode({ data }) {
  const { node, suggested, layout, isLocked, onViewModules } = data;
  const stage = stageInfo(node.stage);
  const modules = node.modules || [];
  const doneCount = modules.filter((m) => m.status === "completed").length;
  const totalCount = modules.length;

  return (
    <div
      className={cn(
        "group w-[520px] rounded-xl border-2 bg-card p-5 shadow-sm transition-shadow",
        isLocked ? "opacity-60" : "hover:shadow-md",
        node.status === "in_progress" && "border-primary shadow-[0_6px_20px_rgba(91,95,239,0.18)]",
        node.status === "completed" && "border-success/50",
        suggested && node.status !== "in_progress" && "border-warning",
        node.status === "not_started" && !suggested && "border-border"
      )}
    >
      {layout.in && (
        <Handle type="target" position={layout.in} className="!size-1.5 !border-0 !bg-transparent" />
      )}
      <div className="mb-2 flex items-center justify-between">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full",
            node.status === "completed" && "bg-success text-success-foreground",
            node.status === "in_progress" && "bg-primary text-primary-foreground",
            node.status === "not_started" && "bg-secondary"
          )}
        >
          {node.status === "completed" && <Check className="size-5" />}
          {node.status === "in_progress" && <span className="size-2 rounded-full bg-white" />}
        </span>
        {isLocked ? (
          <Lock className="size-3.5 text-muted-foreground" />
        ) : suggested ? (
          <Badge variant="warning" className="px-3.5 py-1 text-[15px]">SUGGESTED</Badge>
        ) : (
          <span
            className="font-mono text-2xl font-bold"
            style={{ color: matchColor(node.match) }}
          >
            {node.match}%
          </span>
        )}
      </div>
      <div className="text-3xl font-extrabold leading-tight text-foreground">{node.title}</div>
      <div className="mt-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <Badge variant={stage.variant} className="px-4 py-1.5 text-lg">{stage.label}</Badge>
          {!isLocked && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewModules(); }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3.5 text-xl font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:scale-[1.03] hover:shadow-lg active:scale-95"
            >
              <Layers className="size-6" /> View Modules
            </button>
          )}
        </div>
        <span className="font-mono text-xl text-muted-foreground">{node.duration}</span>
      </div>
      {/* Module progress bar */}
      {totalCount > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xl font-bold text-muted-foreground">{doneCount}/{totalCount} modules</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: totalCount ? `${(doneCount / totalCount) * 100}%` : "0%" }}
            />
          </div>
        </div>
      )}
      {layout.out && (
        <Handle type="source" position={layout.out} className="!size-1.5 !border-0 !bg-transparent" />
      )}
    </div>
  );
}

// Stable references (React Flow requirement).
const nodeTypes = { wp: WayPointNode };

const COL_W = 660;
const ROW_H = 380;
const LAYOUT = {
  f1: { col: 0, row: 0, in: null, out: Position.Right },
  f2: { col: 1, row: 0, in: Position.Left, out: Position.Right },
  f3: { col: 2, row: 0, in: Position.Left, out: Position.Bottom },
  d1: { col: 2, row: 1, in: Position.Top, out: Position.Left },
  d2: { col: 1, row: 1, in: Position.Right, out: Position.Left },
  m1: { col: 0, row: 1, in: Position.Right, out: Position.Bottom },
  m2: { col: 0, row: 2, in: Position.Top, out: Position.Right },
  m3: { col: 1, row: 2, in: Position.Left, out: null },
};
const POSITIONS = NODE_ORDER.map((id) => ({
  id,
  x: LAYOUT[id].col * COL_W,
  y: LAYOUT[id].row * ROW_H,
}));

function RoadmapFlow({ track, onOpen, onViewModules }) {
  const suggested = suggestedNextId(track);

  const nodes = React.useMemo(
    () =>
      POSITIONS.map(({ id, x, y }) => {
        const isLocked = false; // Nodes are fully unlocked as requested
        return {
          id,
          type: "wp",
          position: { x, y },
          data: {
            node: track.nodeMap[id],
            suggested: id === suggested,
            layout: LAYOUT[id],
            isLocked,
            onViewModules: () => onViewModules(id),
          },
        };
      }),
    [track, suggested, onViewModules]
  );

  const edges = React.useMemo(
    () =>
      EDGES.map(([a, b]) => {
        const done = track.nodeMap[a].status === "completed";
        return {
          id: `${a}-${b}`,
          source: a,
          target: b,
          animated: true, // Show moving flow arrows everywhere
          style: { stroke: done ? "#0ea5a4" : "#94a3b8", strokeWidth: 4 },
          markerEnd: { type: MarkerType.ArrowClosed, width: 24, height: 24, color: done ? "#0ea5a4" : "#94a3b8" },
        };
      }),
    [track]
  );

  return (
    <Card className="overflow-hidden p-0 relative">
      <div className="wp-flow h-[calc(100vh-15rem)] min-h-[500px] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, n) => {
            if (n.data.isLocked) {
              toast.error("Module Locked", { description: "Please complete the previous module to unlock this step." });
              return;
            }
            onOpen(n.id);
          }}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          nodesDraggable={false}
          nodesConnectable={false}
          minZoom={0.4}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant="dots" gap={22} size={1} color="var(--border)" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => {
              const st = n.data?.node?.status;
              if (st === "completed") return "#0ea5a4";
              if (st === "in_progress") return "#5b5fef";
              return "#c9ccda";
            }}
            maskColor="color-mix(in srgb, var(--background) 70%, transparent)"
          />
        </ReactFlow>
      </div>
    </Card>
  );
}

/* â”€â”€â”€ Tree view â€” Course-style accordion with module checkboxes â”€â”€â”€ */

// Single node in the course accordion
function NodeAccordion({ id, track, suggested, onOpen, trackId, color, expandedNodeId, setExpandedNodeId }) {
  const node = track.nodeMap[id];
  const { updateModuleStatus, updateAllModulesStatus } = useApp();
  const isSuggested = id === suggested;
  const stage = stageInfo(node.stage);
  const modules = node.modules || [];
  const doneCount = modules.filter((m) => m.status === "completed").length;
  const totalCount = modules.length;

  // Auto-expand if flagged by "View Modules" from Flow
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (expandedNodeId === id) {
      setOpen(true);
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        // Delay clearing the state so parent CourseSection also gets a chance to see it and expand.
        setExpandedNodeId(null); 
      }, 600);
    }
  }, [expandedNodeId, id, setExpandedNodeId]);

  const handleModuleToggle = (moduleIndex, currentStatus) => {
    const newStatus = currentStatus === "completed" ? "not_started" : "completed";
    updateModuleStatus(trackId, id, moduleIndex, newStatus);
  };

  const [togglingAll, setTogglingAll] = React.useState(false);
  const allModulesDone = totalCount > 0 && doneCount === totalCount;

  const handleToggleAll = async (e) => {
    e.stopPropagation();
    if (togglingAll) return;
    setTogglingAll(true);
    const targetStatus = allModulesDone ? "not_started" : "completed";
    
    await updateAllModulesStatus(trackId, id, targetStatus);
    
    setTogglingAll(false);
  };

  const isTargetExpanded = expandedNodeId === id;

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "rounded-xl border bg-card shadow-sm overflow-hidden transition-all duration-700",
        isTargetExpanded && "ring-2 ring-primary shadow-[0_0_20px_rgba(91,95,239,0.2)]"
      )}
    >
      {/* Parent node header row */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => { if (totalCount > 0) setOpen(!open); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (totalCount > 0) setOpen(!open);
          }
        }}
        className={cn(
          "group w-full text-left outline-none border-l-4 transition-all hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
          node.status === "completed" && "border-l-success/70",
          node.status === "in_progress" && "border-l-primary",
          node.status === "not_started" && isSuggested && "border-l-warning",
          node.status === "not_started" && !isSuggested && "border-l-border"
        )}
      >
        <div className="flex items-center gap-3 p-3.5">
          {/* Status icon */}
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              node.status === "completed" && "bg-success text-success-foreground",
              node.status === "in_progress" && "bg-primary text-primary-foreground",
              node.status === "not_started" && "bg-secondary"
            )}
          >
            {node.status === "completed" && <Check className="size-4" />}
            {node.status === "in_progress" && <span className="size-1.5 rounded-full bg-white" />}
            {node.status === "not_started" && <BookOpen className="size-3.5 text-muted-foreground" />}
          </span>

          {/* Title + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold leading-tight">{node.title}</span>
              {isSuggested && node.status !== "in_progress" && (
                <Badge variant="warning" className="px-1.5 py-0 text-[9px]">SUGGESTED</Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <Badge variant={stage.variant} className="px-1.5 py-0 text-[9px]">{stage.label}</Badge>
              <span className="font-mono text-[10px] text-muted-foreground">{node.duration}</span>
              {totalCount > 0 && (
                <span className="text-[10px] text-muted-foreground font-medium">
                  {doneCount}/{totalCount} done
                </span>
              )}
            </div>
            {/* Module progress bar */}
            {totalCount > 0 && (
              <div className="mt-2 h-1 w-full rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%` }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-1">
            {/* AI Guide button */}
            <button
              onClick={(e) => { e.stopPropagation(); onOpen(id); }}
              title="Open AI Guide"
              className="flex size-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            >
              <MessageSquare className="size-3.5" />
            </button>
            {/* Expand/collapse toggle */}
            {totalCount > 0 && (
              <div
                className="flex size-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors group-hover:bg-accent"
              >
                <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module checklist */}
      <AnimatePresence initial={false}>
        {open && totalCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/40 px-4 py-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Modules to complete
                </p>
                <button
                  onClick={handleToggleAll}
                  disabled={togglingAll}
                  className={cn(
                    "group flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50",
                    allModulesDone 
                      ? "border-success/30 bg-success/10 text-success hover:bg-success/20"
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent"
                  )}
                >
                  <span className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border transition-all shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]",
                    allModulesDone
                      ? "border-success bg-success text-white"
                      : "border-border bg-background group-hover:border-primary/50"
                  )}>
                    {allModulesDone && <Check className="size-3" />}
                  </span>
                  {togglingAll ? "Updating..." : allModulesDone ? "Uncheck all modules" : "Check all modules"}
                </button>
              </div>
              
              {modules.map((module, idx) => {
                const isModuleDone = module.status === "completed";
                return (
                  <button
                    key={idx}
                    onClick={() => handleModuleToggle(idx, module.status)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-all w-full border border-transparent",
                      isModuleDone
                        ? "bg-success/5 text-success-foreground hover:bg-success/10 hover:border-success/20"
                        : "hover:bg-accent/40 hover:border-border/50 hover:shadow-sm"
                    )}
                  >
                    {/* Checkbox */}
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                        isModuleDone
                          ? "border-success bg-success text-white"
                          : "border-border bg-background group-hover:border-primary/50"
                      )}
                    >
                      {isModuleDone && <Check className="size-3" />}
                    </span>
                    <span className={cn("flex-1 text-[13px] font-medium transition-colors", isModuleDone ? "text-muted-foreground" : "text-foreground group-hover:text-primary")}>
                      {module.title}
                    </span>
                    
                    {/* Fixed-width Right Actions Container */}
                    <div className="shrink-0 flex items-center gap-3 ml-2">
                      {/* Dual Icons with more space */}
                      <div className="flex items-center gap-2.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <PlayCircle className="size-4 text-red-500" />
                        <FileText className="size-3.5 text-blue-500" />
                      </div>
                      {/* Static Action Indicator */}
                      <div className={cn(
                        "text-[10px] font-bold uppercase tracking-wider hidden sm:block w-[45px] text-right",
                        isModuleDone ? "text-success" : "text-primary"
                      )}>
                        {isModuleDone ? "Review" : "Start"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Branch section (Foundations / Core Build / Advanced Capstone)
function CourseSection({ branch, track, suggested, onOpen, trackId, expandedNodeId, setExpandedNodeId }) {
  const [open, setOpen] = React.useState(branch.defaultOpen !== false);

  // Auto-open this section if it contains the target node from Flow view
  React.useEffect(() => {
    if (expandedNodeId && branch.children.includes(expandedNodeId)) {
      setOpen(true);
    }
  }, [expandedNodeId, branch.children]);

  // Count completed nodes in this branch
  const doneNodes = branch.children.filter((id) => track.nodeMap[id]?.status === "completed").length;
  const totalNodes = branch.children.length;
  const pct = Math.round((doneNodes / totalNodes) * 100);

  const isSuggestedSection = branch.children.includes(suggested);
  const isCompletedSection = doneNodes === totalNodes && totalNodes > 0;

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        isSuggestedSection && "border-primary/50 shadow-[0_0_30px_rgba(91,95,239,0.15)] ring-1 ring-primary/20",
        isCompletedSection && "border-success/50 bg-success/5"
      )}
    >
      {/* Section header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left outline-none transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-semibold">{branch.label}</h3>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full"
              style={{ background: branch.color }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground shrink-0">
          {doneNodes}/{totalNodes} steps
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Collapsible node list */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 px-4 pb-4 pt-1">
              {branch.children.map((id) => (
                <NodeAccordion
                  key={id}
                  id={id}
                  track={track}
                  suggested={suggested}
                  onOpen={onOpen}
                  trackId={trackId}
                  color={branch.color}
                  expandedNodeId={expandedNodeId}
                  setExpandedNodeId={setExpandedNodeId}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function RoadmapTree({ track, onOpen, trackId, expandedNodeId, setExpandedNodeId }) {
  const suggested = suggestedNextId(track);
  return (
    <div className="relative flex flex-col gap-8 ml-2 md:ml-4 pb-10">
      {/* The Timeline Spine */}
      <div className="absolute left-6 top-8 bottom-4 w-0.5 bg-border/50 hidden md:block" />
      
      {TREE_BRANCHES.map((b, i) => (
        <div key={b.id} className="relative flex items-start gap-4 md:gap-6">
          {/* Spine dot (only visible on md+ to align with spine) */}
          <div className="hidden md:flex mt-6 size-12 shrink-0 items-center justify-center rounded-2xl border-4 border-background bg-card shadow-sm z-10 relative">
             <span
               className="flex size-full items-center justify-center rounded-xl font-mono text-lg font-bold text-white"
               style={{ background: b.color }}
             >
               {i + 1}
             </span>
          </div>

          <div className="flex-1 min-w-0">
            <CourseSection
              branch={b}
              track={track}
              suggested={suggested}
              onOpen={onOpen}
              trackId={trackId}
              index={i}
              expandedNodeId={expandedNodeId}
              setExpandedNodeId={setExpandedNodeId}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* â”€â”€â”€ Page â”€â”€â”€ */
export default function Roadmap() {
  const navigate = useNavigate();
  const {
    activeTrackId, tracks, openNode, roadmapView, setRoadmapView,
    generateAndLoadRoadmap, userProfile, simulatedHours,
    expandedNodeId, setExpandedNodeId,
  } = useApp();
  const baseTrack = tracks[activeTrackId] || Object.values(tracks)[0];
  const [generating, setGenerating] = React.useState(false);

  const [hasAttemptedGen, setHasAttemptedGen] = React.useState(false);

  const handleViewModules = React.useCallback((nodeId) => {
    setRoadmapView("tree");
    setExpandedNodeId(nodeId);
  }, [setRoadmapView, setExpandedNodeId]);


  const track = React.useMemo(() => {
    if (!baseTrack) return null;
    const baseline = userProfile?.weeklyTimeHours || 6;
    const sim = simulatedHours ?? baseline;
    if (baseline === sim) return baseTrack;

    const newTrack = { ...baseTrack, nodeMap: { ...baseTrack.nodeMap } };
    for (const id in newTrack.nodeMap) {
      newTrack.nodeMap[id] = {
        ...newTrack.nodeMap[id],
        duration: scaleDuration(newTrack.nodeMap[id].duration, baseline, sim)
      };
    }
    return newTrack;
  }, [baseTrack, userProfile, simulatedHours]);

  React.useEffect(() => {
    if (activeTrackId && !tracks[activeTrackId] && !generating && !hasAttemptedGen) {
      setGenerating(true);
      setHasAttemptedGen(true);
      generateAndLoadRoadmap(activeTrackId).finally(() => setGenerating(false));
    }
  }, [activeTrackId, tracks, generating, generateAndLoadRoadmap, hasAttemptedGen]);

  if (!track) {
    return (
      <div className="mx-auto max-w-7xl flex flex-col items-center justify-center px-4 py-32 sm:px-6 min-h-[60vh]">
        <Loader2 className="size-12 animate-spin text-primary mb-6" />
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl font-semibold mb-2">Generating your personalized roadmap...</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">Groq AI is analyzing your skills and building the optimal learning path.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-6">
      {/* Sticky Right-side Buttons */}
      <div className="sticky top-[76px] z-20 flex justify-end pointer-events-none mb-[-44px]">
        <div className="pointer-events-auto flex flex-wrap items-center gap-3">

          <div className="flex items-center rounded-full border-2 border-border bg-card p-1 shadow-sm shrink-0">
            {!Object.values(track.nodeMap).every(n => n.status === "completed") && (
              <span className="hidden sm:inline-block text-sm font-bold text-foreground px-3">
                Complete all modules to unlock
              </span>
            )}
              <button
                onClick={() => navigate("/final-assessment")}
                disabled={!Object.values(track.nodeMap).every(n => n.status === "completed")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-bold transition-all border",
                  Object.values(track.nodeMap).every(n => n.status === "completed")
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-md"
                    : "bg-secondary text-secondary-foreground border-border/60 cursor-not-allowed opacity-90"
                )}
              >
                Take Final Assessment
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-full border-2 border-border bg-card p-1 shadow-sm shrink-0">
              {[
                { id: "flow", label: "Flow", icon: RouteIcon },
                { id: "tree", label: "Modules", icon: GitFork },
              ].map((v) => {
                const Icon = v.icon;
                const active = roadmapView === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setRoadmapView(v.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold transition-all border",
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-transparent text-foreground border-transparent hover:border-border hover:bg-accent"
                    )}
                  >
                    <Icon className="size-4" /> {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Normal Header Text (scrolls normally) */}
        <div className="mb-5 min-h-[48px] max-w-[60%] pt-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">Your Learning Path</h1>
          <p className="text-sm text-muted-foreground">{track.label} Track</p>
        </div>
        {roadmapView === "tree" && (
          <div className="mt-2 mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono uppercase tracking-wide">Staged path</span>
            {TREE_BRANCHES.map((b, i) => (
              <React.Fragment key={b.id}>
                {i > 0 && <span className="text-border">→</span>}
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: b.color }} />
                  {b.label}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      {roadmapView === "flow" ? (
        <RoadmapFlow track={track} onOpen={openNode} onViewModules={handleViewModules} />
      ) : (
        <RoadmapTree
          track={track}
          onOpen={openNode}
          trackId={activeTrackId}
          expandedNodeId={expandedNodeId}
          setExpandedNodeId={setExpandedNodeId}
        />
      )}

      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground pb-8">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Explore any module in any order! The amber "Suggested"
        badge points to your highest-impact next move.
      </p>
    </div>
  );
}

