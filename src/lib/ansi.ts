/**
 * The CLI's own SGR escapes, turned into spans at build time.
 *
 * agsync emits a deliberately small set — bold, dim, red, yellow — so this
 * parses that set rather than pretending to be a general terminal emulator.
 * Anything unrecognised keeps the current colour instead of vanishing.
 */
export interface Span {
  text: string;
  cls: string;
}

const CLASS: Record<number, string> = {
  1: "text-fg",
  2: "text-subtle",
  31: "text-error",
  32: "text-ok",
  33: "text-warn",
  90: "text-subtle",
};

const SGR = /\u001b\[([0-9;]*)m/g;

export function toLines(output: string): Span[][] {
  const lines: Span[][] = [];
  let cls = "";

  for (const line of output.split("\n")) {
    const spans: Span[] = [];
    let last = 0;
    SGR.lastIndex = 0;

    const push = (text: string) => {
      if (!text) return;
      const prev = spans.at(-1);
      if (prev && prev.cls === cls) prev.text += text;
      else spans.push({ text, cls });
    };

    for (let m = SGR.exec(line); m; m = SGR.exec(line)) {
      push(line.slice(last, m.index));
      last = m.index + m[0].length;
      for (const code of (m[1] || "0").split(";")) {
        const n = Number(code || 0);
        cls = n === 0 ? "" : (CLASS[n] ?? cls);
      }
    }
    push(line.slice(last));
    lines.push(spans);
  }

  return lines;
}

/** Plain text, for the screen-reader alternative. */
export function toPlain(output: string): string {
  return output.replace(SGR, "");
}
