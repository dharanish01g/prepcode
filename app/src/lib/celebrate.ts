import confetti from "canvas-confetti";

// Teal like the theme's primary, with green and amber for a festive mix.
const COLORS = ["#0d9488", "#14b8a6", "#5eead4", "#10b981", "#f59e0b"];

// Drawn on the page, not in a worker: the default worker draws on an
// OffscreenCanvas, which the macOS webview (WebKit) doesn't reliably support,
// and then nothing shows.
let fire: confetti.CreateTypes | null = null;

/**
 * A party popper: confetti bursts from both bottom corners, for a solved
 * question. Skipped for students who've asked their system for less motion.
 */
export function celebrate() {
  fire ??= confetti.create(undefined, { resize: true, useWorker: false });
  const burst = {
    particleCount: 80,
    spread: 60,
    startVelocity: 55,
    colors: COLORS,
    disableForReducedMotion: true,
  };
  void fire({ ...burst, angle: 60, origin: { x: 0, y: 1 } });
  void fire({ ...burst, angle: 120, origin: { x: 1, y: 1 } });
}
