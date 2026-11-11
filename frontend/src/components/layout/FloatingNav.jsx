import * as React from "react";
import { useScrolled } from "@/hooks/useScrolled";
import { cn } from "@/lib/utils";

/**
 * Shared shell for WayPoint's navbar (marketing + logged-in app).
 *
 * It's a rounded, glassy floating pill at all times. At the top of the page
 * it sits inset ~5% from each side (90% wide). Once the user scrolls, it
 * compresses into a tighter island with a stronger shadow, and stays fixed.
 * Height + top margin stay small so the page's `pt-16` offset always clears it.
 *
 * Callers provide their own contents via `children` (marketing links vs the
 * logged-in tabs), so the compress/glass treatment is identical everywhere.
 *
 * `wide` picks a roomier compressed width. The logged-in nav carries far more
 * content (logo + 4 tabs + search + theme + track selector) than the marketing
 * nav, and squeezing it to ~68% forced the tab pills to wrap — which spilled
 * them out of the fixed `h-14` shell. Wide keeps the compress effect without
 * ever starving the content of horizontal room.
 */
export default function FloatingNav({ children, className, wide = false }) {
  const scrolled = useScrolled(12);

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center">
      <div
        data-scrolled={scrolled}
        className={cn(
          // `overflow-hidden` is the safety net: even mid-transition, nothing can
          // visually escape the pill's height.
          "group glass flex h-14 items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border/60",
          "transition-[width,margin,box-shadow,padding,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          // Expanded (top of page): floating pill inset ~5% each side, soft shadow
          "mt-2 w-[90%] px-4 shadow-sm shadow-black/[0.04] sm:px-6",
          // Compressed (scrolled): tighter island, stronger shadow
          "data-[scrolled=true]:mt-3 data-[scrolled=true]:w-[calc(100%-1.5rem)] data-[scrolled=true]:px-3.5 data-[scrolled=true]:shadow-lg data-[scrolled=true]:shadow-black/[0.07]",
          wide
            ? "md:data-[scrolled=true]:w-[94%] lg:data-[scrolled=true]:w-[88%]"
            : "md:data-[scrolled=true]:w-[70%] lg:data-[scrolled=true]:w-[68%]",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
