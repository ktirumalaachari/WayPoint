import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageCircle,
  GitBranch,
  Route,
  LayoutDashboard,
  Sun,
  Moon,
  Search,
  GitFork,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import TrackSelector from "@/components/common/TrackSelector";
import UserMenu from "@/components/common/UserMenu";
import FloatingNav from "@/components/layout/FloatingNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TABS = [
  { path: "/onboarding", label: "Onboarding", icon: MessageCircle },
  { path: "/path-select", label: "My Paths", icon: GitBranch },
  { path: "/roadmap", label: "Roadmap", icon: Route },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, setCommandOpen, demoMode, setRoadmapView } = useApp();

  const handleJumpToModules = () => {
    setRoadmapView("tree");
    navigate("/roadmap");
  };

  return (
    /* `wide` = roomier compressed width. This nav carries a lot (logo + 4 tabs +
       search + theme + track + account); at the marketing nav's ~68% the tabs
       wrapped and spilled out of the pill's fixed height. Every child below is
       also `shrink-0`/`nowrap` so the row can never wrap mid-transition. */
    <FloatingNav wide>
      {/* Logo */}
      <button
        onClick={() => navigate("/dashboard")}
        className="flex shrink-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm overflow-hidden">
          <img src="/waypoint.svg" alt="WayPoint" className="size-full object-cover" />
        </span>
        <span className="whitespace-nowrap font-display text-lg font-semibold tracking-tight text-foreground">
          WayPoint
        </span>
        {demoMode && (
          <Badge variant="warning" className="hidden shrink-0 sm:inline-flex">
            Demo
          </Badge>
        )}
      </button>

      {/* Center: pill tabs — icon-only between md and lg so they always fit */}
      {/* Accessibility wrapper */}
      <nav className="hidden shrink-0 items-center gap-1 rounded-full border border-border bg-card/60 p-1 shadow-sm md:flex">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              title={tab.label}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring lg:px-3.5",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-primary shadow-[0_2px_8px_rgba(91,95,239,0.35)]"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative z-10 size-4 shrink-0" />
              <span className="relative z-10 hidden lg:inline">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right cluster */}
      <div className="flex shrink-0 items-center gap-3.5">
        {!location.pathname.startsWith("/onboarding") && (
          <Button 
            variant="default" 
            size="sm" 
            className="hidden shrink-0 shadow-[0_2px_8px_rgba(91,95,239,0.35)] sm:flex gap-1.5 h-8 bg-primary hover:bg-primary/90 px-3 transition-all"
            onClick={handleJumpToModules}
          >
            <GitFork className="size-3.5" />
            <span>Modules</span>
          </Button>
        )}

        {/* Compact Utilities Group */}
        <div className="hidden shrink-0 items-center rounded-lg border border-border bg-card/60 shadow-sm sm:flex overflow-hidden h-8">
          <button
            onClick={() => setCommandOpen(true)}
            className="flex h-full items-center justify-center px-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground border-r border-border"
            aria-label="Search — open command palette"
            title="Search (⌘K)"
          >
            <Search className="size-4" />
          </button>

          <button
            onClick={toggleTheme}
            className="flex h-full items-center justify-center px-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>

        {!location.pathname.startsWith("/onboarding") && <TrackSelector />}

        <UserMenu />
      </div>
    </FloatingNav>
  );
}
