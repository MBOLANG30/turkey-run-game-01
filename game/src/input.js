// Turkey Run — keyboard, mouse and touch input.
// One job: turn raw presses into game intents (jump, duck, start, restart),
// with edge detection so one press never fires twice.

/** Tracks keys and pointer presses; the game polls it once per frame. */
export class Input {
  constructor(canvas) {
    this.jumpQueued = false;
    this.duckHeld = false;
    this.restartQueued = false;
    this.startQueued = false;
    this.anyKeyQueued = false;
    this.keys = new Set();

    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      this.keys.add(event.code);
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        this.jumpQueued = true;
        this.startQueued = true;
        event.preventDefault();
      }
      if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        this.duckHeld = true;
        event.preventDefault();
      }
      if (event.code === 'KeyR' || event.code === 'Enter') {
        this.restartQueued = true;
        this.startQueued = true;
      }
      if (event.code === 'KeyM') this.muteQueued = true;
      this.anyKeyQueued = true;
    });

    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
      if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        this.duckHeld = this.keys.has('ArrowDown') || this.keys.has('KeyS');
      }
    });

    canvas.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.jumpQueued = true;
      this.startQueued = true;
      this.anyKeyQueued = true;
    });

    // Losing focus must never leave the turkey ducking forever.
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.duckHeld = false;
    });

    this.muteQueued = false;
  }

  /** Consume one queued jump press, if any. */
  takeJump() {
    const queued = this.jumpQueued;
    this.jumpQueued = false;
    return queued;
  }

  /** Consume one queued start press, if any. */
  takeStart() {
    const queued = this.startQueued;
    this.startQueued = false;
    this.anyKeyQueued = false;
    return queued;
  }

  /** Consume one queued restart press, if any. */
  takeRestart() {
    const queued = this.restartQueued;
    this.restartQueued = false;
    return queued;
  }

  /** Consume one queued mute toggle, if any. */
  takeMute() {
    const queued = this.muteQueued;
    this.muteQueued = false;
    return queued;
  }

  /** Clear every queued press (used when the state changes). */
  clearQueues() {
    this.jumpQueued = false;
    this.restartQueued = false;
    this.startQueued = false;
    this.anyKeyQueued = false;
  }
}
