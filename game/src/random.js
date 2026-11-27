// Turkey Run — small seeded random helpers.
// One job: deterministic randomness for screenshot poses and level pieces,
// so the same seed always deals the same farm.

/** Mulberry32: a tiny seeded generator with a stable sequence per seed. */
export function mulberry32(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random float between min and max from a generator function. */
export function randomRange(random, min, max) {
  return min + random() * (max - min);
}

/** A random integer between min and max (inclusive) from a generator function. */
export function randomInt(random, min, max) {
  return Math.floor(randomRange(random, min, max + 1));
}

/** Pick one element of an array at random from a generator function. */
export function randomPick(random, items) {
  return items[Math.floor(random() * items.length)];
}
