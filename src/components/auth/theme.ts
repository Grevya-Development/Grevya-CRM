import type { Variants } from "framer-motion";

// Grevya brand colours, sampled from the logo.
export const BRAND = {
  red: "#F25022",
  amber: "#FFB900",
  green: "#84B900",
  blue: "#00A3EE",
  navy: "#0B1A3C",
};

/** Entrance used by every element on the auth pages (staggered by the parent). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

/** Readable message from an unknown thrown value. */
export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String((err as { message: unknown }).message) : "";
