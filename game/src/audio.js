// Kuali Rush: every sound the kitchen makes, synthesized live with WebAudio. No audio files:
// short oscillator blips and filtered noise, so the game loads nothing over the network.

/** Lazily built on the first user gesture, so the page never asks for audio before play. */
let ctx = null;
let muted = false;

/** Create (or reuse) the shared audio context; null when the browser has no WebAudio. */
function audioCtx() {
  if (ctx !== null) return ctx;
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? window.webkitAudioContext;
  if (AC === undefined) return null;
  ctx = new AC();
  return ctx;
}

/** Resume the context from a user gesture; safe to call before any sound plays. */
export function unlockAudio() {
  const ac = audioCtx();
  if (ac !== null && ac.state === 'suspended') void ac.resume();
}

/** Mute or unmute every sound; returns the new state. */
export function setMuted(value) {
  muted = value;
  return muted;
}

/** Whether sounds are muted right now. */
export function isMuted() {
  return muted;
}

/** One short tone: frequency, length in seconds, shape and loudness. */
function blip(freq, dur, type, gain, slideTo) {
  if (muted) return;
  const ac = audioCtx();
  if (ac === null) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** A burst of filtered noise, for chops and sizzles. */
function noiseBurst(dur, freq, gain) {
  if (muted) return;
  const ac = audioCtx();
  if (ac === null) return;
  const t = ac.currentTime;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const amp = ac.createGain();
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(ac.destination);
  src.start(t);
}

/** The named kitchen sounds, one function each. */
export const sfx = {
  pick() {
    blip(520, 0.07, 'triangle', 0.12);
  },
  place() {
    blip(340, 0.08, 'triangle', 0.12, 260);
  },
  chop() {
    noiseBurst(0.06, 1800, 0.2);
  },
  sizzle() {
    noiseBurst(0.25, 5200, 0.06);
  },
  done() {
    blip(660, 0.09, 'sine', 0.14);
    setTimeout(() => blip(880, 0.12, 'sine', 0.14), 90);
  },
  serve() {
    blip(523, 0.1, 'sine', 0.16);
    setTimeout(() => blip(659, 0.1, 'sine', 0.16), 90);
    setTimeout(() => blip(784, 0.16, 'sine', 0.16), 180);
  },
  miss() {
    blip(220, 0.25, 'sawtooth', 0.08, 140);
  },
  error() {
    blip(180, 0.12, 'square', 0.07);
  },
  tick() {
    blip(980, 0.05, 'sine', 0.07);
  },
  rush() {
    blip(392, 0.12, 'triangle', 0.14);
    setTimeout(() => blip(523, 0.12, 'triangle', 0.14), 120);
    setTimeout(() => blip(659, 0.2, 'triangle', 0.14), 240);
  },
};
