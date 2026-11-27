// Turkey Run — synthesized sound effects, no audio files.
// One job: every chirp, thud and fanfare the game plays, built with the
// Web Audio API so the game ships zero sound assets and works offline.

/** A tiny synth: named effects played through oscillators and noise. */
export class SoundEngine {
  constructor() {
    this.context = null;
    this.muted = false;
    this.master = null;
  }

  /** Create the audio context on the first player gesture (browsers require it). */
  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.context.destination);
    } catch {
      this.context = null;
    }
  }

  /** Flip mute on or off; returns the new muted state. */
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /** One oscillator blip: frequency slides from `fromHz` to `toHz`. */
  tone(fromHz, toHz, durationSec, type = 'sine', volume = 0.5, delaySec = 0) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + delaySec;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(fromHz, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), start + durationSec);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + durationSec);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + durationSec + 0.02);
  }

  /** A burst of filtered noise, for thuds and wing flaps. */
  noise(durationSec, volume = 0.4, delaySec = 0) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + delaySec;
    const length = Math.max(1, Math.floor(this.context.sampleRate * durationSec));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + durationSec);
    source.connect(gain);
    gain.connect(this.master);
    source.start(start);
  }

  jump() {
    this.tone(280, 620, 0.16, 'sine', 0.45);
  }

  doubleJump() {
    this.tone(420, 880, 0.14, 'triangle', 0.4);
    this.noise(0.08, 0.12);
  }

  corn() {
    this.tone(880, 880, 0.07, 'sine', 0.35);
    this.tone(1320, 1320, 0.09, 'sine', 0.3, 0.06);
  }

  hit() {
    this.noise(0.22, 0.6);
    this.tone(160, 60, 0.25, 'square', 0.4);
  }

  gobble() {
    // Two low gobbles: the turkey's war cry when the run starts.
    this.tone(220, 140, 0.09, 'square', 0.35);
    this.tone(200, 120, 0.09, 'square', 0.35, 0.12);
    this.tone(240, 150, 0.12, 'square', 0.35, 0.26);
  }

  caught() {
    this.tone(320, 90, 0.5, 'sawtooth', 0.4);
    this.tone(240, 70, 0.55, 'sawtooth', 0.35, 0.15);
  }

  escaped() {
    // A short victory arpeggio.
    const notes = [523, 659, 784, 1047];
    notes.forEach((note, i) => this.tone(note, note, 0.16, 'triangle', 0.4, i * 0.11));
  }
}
