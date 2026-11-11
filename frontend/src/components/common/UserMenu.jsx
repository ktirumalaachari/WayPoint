import * as React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Plus, ChevronDown, ShieldCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/** First letters of the user's name — "Prashant Kumar" → "PK". */
function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("") || "U"
  );
}

/**
 * Account menu in the logged-in navbar — this is where Log out lives.
 * The avatar doubles as the "you are signed in" signal, so the nav gets an
 * account affordance without adding another naked icon button.
 */
export default function UserMenu() {
  const navigate = useNavigate();
  const { userProfile, logout } = useApp();

  const signOut = () => {
    logout();
    navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card p-0.5 pr-1.5 shadow-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu — profile and log out"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#8b5cf6] font-mono text-[11px] font-bold text-primary-foreground">
            {initials(userProfile.name)}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* Identity block */}
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#8b5cf6] font-mono text-xs font-bold text-primary-foreground">
            {initials(userProfile.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">
              {userProfile.name}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {userProfile.email}
            </div>
          </div>
        </div>
        <div className="mx-2 mb-1 flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1.5">
          <ShieldCheck className="size-3.5 shrink-0 text-success" />
          <span className="truncate text-[11px] text-muted-foreground">
            Targeting{" "}
            <span className="font-medium text-foreground">{userProfile.targetRole}</span>
          </span>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => navigate("/add-skill")} className="gap-2.5">
          <Plus />
          Add a new skill
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/profile")} className="gap-2.5">
          <Settings />
          Edit my profile
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onSelect={signOut}
          className="gap-2.5 font-medium [&_svg]:text-destructive"
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}
