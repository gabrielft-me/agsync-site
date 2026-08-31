/**
 * A keystroke plan for the one command that types itself in.
 *
 * People do not type on a metronome, and they do not type correctly. Every key
 * gets its own delay, a space costs extra because the hand resets, now and then
 * there is a hesitation — and the last two characters come out transposed and
 * have to be backspaced, which is the part that makes it read as a person
 * rather than as an effect.
 *
 * Pure and separate from the component so the shape of it can be tested without
 * a browser.
 */
export interface Key {
  /** A backspace when true, otherwise `c` is the character that lands. */
  del?: true;
  c?: string;
  /** Milliseconds to wait *after* this key. */
  d: number;
}

const rnd = (a: number, b: number, random: () => number) => a + random() * (b - a);

function keyDelay(prev: string, random: () => number): number {
  let d = rnd(48, 118, random);
  if (prev === " ") d += rnd(40, 110, random); // the hand resets after a space
  if (random() < 0.09) d += rnd(120, 260, random); // a hesitation
  return d;
}

export function plan(text: string, random: () => number = Math.random): Key[] {
  const keys: Key[] = [];
  let prev = "";

  const type = (from: number, to: number) => {
    for (let j = from; j < to; j++) {
      keys.push({ c: text[j], d: keyDelay(prev, random) });
      prev = text[j]!;
    }
  };

  const at = text.length - 2;
  const tail = text.slice(at);

  // Too short to transpose, or the swap would be invisible: just type it.
  if (at < 2 || tail[0] === tail[1]) {
    type(0, text.length);
    return keys;
  }

  type(0, at);
  for (const c of [tail[1]!, tail[0]!]) {
    keys.push({ c, d: keyDelay(prev, random) });
    prev = c;
  }
  keys[keys.length - 1]!.d += rnd(220, 380, random); // the beat where you see it
  keys.push({ del: true, d: rnd(55, 95, random) });
  keys.push({ del: true, d: rnd(90, 170, random) });
  prev = text[at - 1] ?? "";
  type(at, text.length);

  return keys;
}

/** Replays a plan the way the animation does, for tests. */
export function replay(keys: Key[]): { frames: string[]; ms: number } {
  const frames: string[] = [];
  let shown = "";
  let ms = 0;
  for (const key of keys) {
    shown = key.del ? shown.slice(0, -1) : shown + key.c;
    frames.push(shown);
    ms += key.d;
  }
  return { frames, ms };
}
