import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  GitBranch,
  Route,
  LayoutDashboard,
  Home,
  Plus,
  Sun,
  Moon,
  Layers,
  Presentation,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

const PAGES = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Roadmap", to: "/roadmap", icon: Route },
  { label: "My Paths", to: "/path-select", icon: GitBranch },
  { label: "Skill Check", to: "/skill-check", icon: Sparkles },
  { label: "Onboarding", to: "/onboarding", icon: MessageCircle },
  { label: "Add a new skill", to: "/add-skill", icon: Plus },
  { label: "Landing", to: "/", icon: Home },
];

export default function CommandPalette() {
  const navigate = useNavigate();
  const {
    commandOpen,
    setCommandOpen,
    tracks,
    setActiveTrackId,
    theme,
    toggleTheme,
    demoMode,
    setDemoMode,
    logout,
  } = useApp();

  // Global ⌘K / Ctrl+K listener
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setCommandOpen]);

  const run = (fn) => {
    setCommandOpen(false);
    // Defer so the dialog can close cleanly before navigation/state change
    requestAnimationFrame(() => fn());
  };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Jump to a page, switch track, run a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {PAGES.map((p) => (
            <CommandItem
              key={p.to}
              value={`go ${p.label}`}
              onSelect={() => run(() => navigate(p.to))}
            >
              <p.icon />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Switch track">
          {Object.values(tracks).map((t) => (
            <CommandItem
              key={t.id}
              value={`track ${t.label}`}
              onSelect={() =>
                run(() => {
                  setActiveTrackId(t.id);
                  navigate("/roadmap");
                })
              }
            >
              <Layers />
              {t.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem value="toggle theme" onSelect={() => run(toggleTheme)}>
            {theme === "dark" ? <Sun /> : <Moon />}
            Toggle {theme === "dark" ? "light" : "dark"} mode
            <CommandShortcut>theme</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="toggle demo mode"
            onSelect={() => run(() => setDemoMode((d) => !d))}
          >
            <Presentation />
            {demoMode ? "Exit demo mode" : "Enter demo mode"}
          </CommandItem>
          <CommandItem
            value="log out sign out"
            onSelect={() =>
              run(() => {
                logout();
                navigate("/");
              })
            }
          >
            <LogOut />
            Log out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
