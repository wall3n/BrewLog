import type { CueKind } from './brewStages';

export interface CuePlayer {
  prime(): void;
  play(kind: CueKind): void;
  close(): void;
}

const BEEP = {
  warning: { freq: 660, seconds: 0.08, vibrate: 60 },
  stage:   { freq: 880, seconds: 0.18, vibrate: 200 },
} as const;

export function createCuePlayer(): CuePlayer {
  let ctx: AudioContext | null = null;
  return {
    // Call this inside a click handler. iOS allows audio only after a user gesture.
    prime(): void {
      if (!ctx && typeof AudioContext !== 'undefined') ctx = new AudioContext();
      void ctx?.resume();
    },
    play(kind: CueKind): void {
      const beep = BEEP[kind];
      if (typeof navigator.vibrate === 'function') navigator.vibrate(beep.vibrate);
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = beep.freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + beep.seconds);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + beep.seconds);
    },
    close(): void {
      void ctx?.close();
      ctx = null;
    },
  };
}
