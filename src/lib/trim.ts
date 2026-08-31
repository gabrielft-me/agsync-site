/**
 * Cuts each scene down to the shortest form that still proves its point.
 *
 * This only ever *selects* lines out of the captured output and records how
 * many it dropped — it never writes a line. Every cut renders as a visible
 * elision, because a silent truncation is indistinguishable from a tool that
 * found less than it did.
 *
 * The rules assert the shape they expect. If a re-capture changes the output,
 * the build fails here rather than quietly showing the wrong three findings.
 */
import type { Scene } from "../data/scenes";
import { toLines, toPlain, type Span } from "./ansi";

export type Row =
  | { kind: "line"; spans: Span[] }
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

const line = (spans: Span[]): Row => ({ kind: "line", spans });

const PLANS: Record<number, (scene: Scene) => Row[]> = {
  // `agsync check` on a repo that decayed: three findings that are damning on
  // sight — an unsatisfiable boot step, a duplicate decision ID, and an index
  // that disagrees with the file it indexes.
  1(scene) {
    const { spans, plain } = split(scene);

    const files = new Set(["AGENTS.md", "memory/decisions.md", "tasks/README.md"]);
    const wanted = [
      /^\s*6\s+error\s+protocol-files-exist\b/,
      /^\s*11\s+error\s+unique-decision-ids\b/,
      /^\s*14\s+error\s+index-matches-files\b/,
    ];

    const findings = plain.filter((l) => FINDING.test(l)).length;
    const last = plain.findLastIndex((l) => FINDING.test(l));
    assert(last > 0, "no findings in the check output");

    const out: Row[] = [];
    let shown = 0;

    for (let i = 0; i <= last; i++) {
      const text = plain[i]!;
      if (FINDING.test(text)) {
        if (wanted.some((re) => re.test(text))) {
          out.push(line(spans[i]!));
          shown++;
        }
      } else if (files.has(text.trim())) {
        out.push(line(spans[i]!));
      }
    }

    assert(shown === wanted.length, `expected ${wanted.length} findings, kept ${shown}`);
    out.push({ kind: "elision", text: `… ${findings - shown} more findings` });

    for (let i = last + 1; i < spans.length; i++) out.push(line(spans[i]!));
    return out;
  },

  // `agsync rules`: five of them, and an honest count of the rest.
  3(scene) {
    const { spans } = split(scene);
    const shown = 5;
    assert(spans.length > shown, "fewer rules than the plan expects");
    return [
      ...spans.slice(0, shown).map(line),
      { kind: "elision", text: `… ${spans.length - shown} more` },
    ];
  },

  // `agsync replay --first-seen`: the per-commit table is the previous scene's
  // job, so this one starts at the survival table.
  5(scene) {
    const { spans, plain } = split(scene);
    const start = plain.findIndex((l) => /^rule\s+first failed\s+survived/.test(l));
    assert(start > 0, "survival table header not found");
    return [
      { kind: "elision", text: `… ${start} lines` },
      ...spans.slice(start).map(line),
    ];
  },
};

export function trim(scene: Scene): Row[] {
  const plan = PLANS[scene.n];
  return plan ? plan(scene) : toLines(scene.output).map(line);
}
