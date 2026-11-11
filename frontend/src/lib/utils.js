import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names, resolving Tailwind conflicts (last wins).
 * Standard shadcn/ui helper used by every UI primitive.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
