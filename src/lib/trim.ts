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

    const files = new Set(["AGENTS.md", "memory/decisions.md", "tasks/README.md"]);
    const wanted = [
      /^\s*6\s+error\s+protocol-files-exist\b/,
      /^\s*11\s+error\s+unique-decision-ids\b/,
      /^\s*14\s+error\s+index-matches-files\b/,
    ];

    const findings = plain.filter((l) => FINDING.test(l)).length;
    const last = plain.findLastIndex((l) => FINDING.test(l));
    assert(last > 0, "no findings in the check output");

    const rows: Row[] = [];
    let kept = 0;

    for (let i = 0; i <= last; i++) {
      const text = plain[i]!;
      const keep = FINDING.test(text)
        ? wanted.some((re) => re.test(text))
        : files.has(text.trim());
      rows.push(keep ? shown(spans[i]!) : extra(spans[i]!));
      if (keep && FINDING.test(text)) kept++;
    }

    assert(kept === wanted.length, `expected ${wanted.length} findings, kept ${kept}`);
    rows.push({ kind: "elision", text: `${findings - kept} more findings` });

    for (let i = last + 1; i < spans.length; i++) rows.push(shown(spans[i]!));
    return rows;
  },

  // pip narrates every build step and names two temp directories on the way.
  // The five lines it left-aligns are the ones that say what happened.
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
