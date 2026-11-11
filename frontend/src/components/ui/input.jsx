import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-lg border border-input bg-background/60 px-3 py-1 text-sm shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] backdrop-blur-sm transition-all outline-none hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)] hover:-translate-y-[1px]",
        "file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:-translate-y-[1px] focus-visible:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)]",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
