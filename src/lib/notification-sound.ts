/**
 * F8 notification chime — a short, subtle two-note tone synthesised with the built-in Web
 * Audio API. No asset file, no dependency, no CDN.
 *
 * Autoplay-safe: the AudioContext starts suspended and is only resumed on the first user
 * gesture (unlockNotificationSound). Until then — and if the browser blocks it —
 * playNotificationSound() is a silent no-op. Every path is guarded so audio can never
 * break notification handling.
 */

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

// Module singletons: one AudioContext for the whole app (browsers cap how many you can
// create), and a throttle timestamp so rapid bursts collapse into one chime.
let ctx: AudioContext | null = null;
let lastPlayedAt = 0;

const MIN_INTERVAL_MS = 400;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext || (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  return ctx;
}

/**
 * Resume the audio context on a user gesture so later chimes are permitted by the browser
 * autoplay policy. Safe to call repeatedly; never throws; never prompts.
 */
export function unlockNotificationSound(): void {
  const c = getContext();
  if (c && c.state === "suspended") {
    c.resume().catch(() => {});
  }
}

/**
 * Play the notification chime once. A silent no-op (never throws) when audio is
 * unavailable, not yet unlocked / blocked, or called again within MIN_INTERVAL_MS.
 */
export function playNotificationSound(): void {
  try {
    const c = getContext();
    if (!c || c.state !== "running") return; // not unlocked / blocked → stay silent

    const nowMs =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    if (nowMs - lastPlayedAt < MIN_INTERVAL_MS) return;
    lastPlayedAt = nowMs;

    const t0 = c.currentTime;
    const notes = [880, 1174.66]; // A5 → D6 — a gentle rising two-note chime
    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      const start = t0 + i * 0.12;
      const dur = 0.15;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.06, start + 0.015); // soft attack (subtle)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur); // quick decay
      osc.connect(gain).connect(c.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  } catch {
    // Audio is non-essential — never let it disrupt notification handling.
  }
}
