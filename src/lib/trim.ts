/**
 * Cuts each scene down to the shortest form that still proves its point.
 *
 * This only ever *marks* lines out of the captured output and counts them — it
 * never writes one. Every cut renders as a visible elision, and the elision is
 * a control: clicking it puts the hidden lines back in their original places,
 * so the full output is always one click away and nothing is destroyed on the
 * way to the page.
 *
 * The rules assert the shape they expect. If a re-capture changes the output,
 * the build fails here rather than quietly showing the wrong three findings.
 */
import type { Scene } from "../data/scenes";
import { toLines, toPlain, type Span } from "./ansi";

export type Row =
  | { kind: "line"; spans: Span[]; extra: boolean }
  | { kind: "elision"; text: string };

const FINDING = /^\s*(?:\d+|-)\s+(?:error|warn)\s/;

function assert(ok: unknown, what: string): asserts ok {
  if (!ok) {
    throw new Error(
      `trim: ${what}. The captured output changed shape — update src/lib/trim.ts or re-run scripts/capture-scenes.sh.`,
    );
  }
}

function split(scene: Scene) {
  const spans = toLines(scene.output);
  const plain = toPlain(scene.output).split("\n");
  assert(spans.length === plain.length, "span and text line counts disagree");
  return { spans, plain };
}

const shown = (spans: Span[]): Row => ({ kind: "line", spans, extra: false });
const extra = (spans: Span[]): Row => ({ kind: "line", spans, extra: true });

const PLANS: Record<string, (scene: Scene) => Row[]> = {
  // `agsync check` on a repo that decayed: three findings that are damning on
  // sight — an unsatisfiable boot step, a duplicate decision ID, and an index
  // that disagrees with the file it indexes.
  "check-rot"(scene) {
    const { spans, plain } = split(scene);

    // How many findings stand, in the order the tool reported them. The rest
    // are still there behind the elision, one click away.
    const SHOW = 8;

    const isFinding = (line: string) => FINDING.test(line);
    const findings = plain.filter(isFinding).length;
    assert(findings > SHOW, `only ${findings} findings; nothing to elide`);

    const last = plain.findLastIndex(isFinding);
    const keep = new Array(plain.length).fill(false);

    let kept = 0;
    for (let i = 0; i <= last; i++) {
      if (isFinding(plain[i]!) && kept < SHOW) {
        keep[i] = true;
        kept++;
        // The file a kept finding belongs to has to come with it.
        for (let j = i - 1; j >= 0; j--) {
          if (isFinding(plain[j]!)) break;
          if (plain[j]!.trim()) {
            keep[j] = true;
            break;
          }
        }
      }
    }
    assert(kept === SHOW, `expected ${SHOW} findings, kept ${kept}`);

    const rows: Row[] = [];
    for (let i = 0; i <= last; i++) {
      rows.push(keep[i] ? shown(spans[i]!) : extra(spans[i]!));
    }
    rows.push({ kind: "elision", text: `${findings - kept} more` });
    for (let i = last + 1; i < spans.length; i++) rows.push(shown(spans[i]!));
    return rows;
  },

  // pip indents the detail and left-aligns the outcome: what it collected,
  // what it downloaded, what it installed. Those four lines are the story; the
  // indented sizes and the version notice underneath are not.
  "install-pip"(scene) {
    const { spans, plain } = split(scene);
    const keep = (line: string) =>
      line.length > 0 && !/^\s/.test(line) && !line.startsWith("[notice]");
    const last = plain.findLastIndex(keep);
    assert(last > 0, "no top-level lines in the pip output");

    const rows: Row[] = [];
    let dropped = 0;
    for (let i = 0; i <= last; i++) {
      if (keep(plain[i]!)) {
        rows.push(shown(spans[i]!));
      } else {
        rows.push(extra(spans[i]!));
        dropped++;
      }
    }
    rows.push({ kind: "elision", text: `${dropped + (plain.length - 1 - last)} more` });
    for (let i = last + 1; i < spans.length; i++) rows.push(extra(spans[i]!));
    return rows;
  },

  // `agsync rules`: five of them, and an honest count of the rest.
  rules(scene) {
    const { spans } = split(scene);
    const cut = 5;
    assert(spans.length > cut, "fewer rules than the plan expects");
    return [
      ...spans.slice(0, cut).map(shown),
      { kind: "elision", text: `${spans.length - cut} more` },
      ...spans.slice(cut).map(extra),
    ];
  },

  // `agsync replay --first-seen`: the per-commit table is the previous scene's
  // job, so this one starts at the survival table.
  "first-seen"(scene) {
    const { spans, plain } = split(scene);
    const start = plain.findIndex((l) => /^rule\s+first failed\s+survived/.test(l));
    assert(start > 0, "survival table header not found");
    return [
      { kind: "elision", text: `${start} lines` },
      ...spans.slice(0, start).map(extra),
      ...spans.slice(start).map(shown),
    ];
  },
};

export function trim(scene: Scene): Row[] {
  const plan = PLANS[scene.id];
  return plan ? plan(scene) : toLines(scene.output).map(shown);
}
