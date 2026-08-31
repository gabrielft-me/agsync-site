/**
 * The orientation scene: where agsync lives in a repository.
 *
 * Unlike everything in scenes.ts, this is authored rather than captured — it
 * is an illustration of a repository layout, not the output of a command, and
 * it is drawn without a prompt or an exit code so it can never be mistaken for
 * one. The invented project is deliberately generic; nothing here is borrowed
 * from a real repo.
 *
 * `surface` marks what agsync actually reads. `mark` is the arrow: the three
 * roots of that surface, which are also the three paths the next scene's check
 * output reports against.
 */
export interface TreeRow {
  depth: number;
  name: string;
  kind: "dir" | "file";
  surface?: boolean;
  mark?: boolean;
}

export const tree: TreeRow[] = [
  { depth: 0, name: "my-service/", kind: "dir" },
  { depth: 1, name: ".github/", kind: "dir" },
  { depth: 1, name: "docker/", kind: "dir" },
  { depth: 1, name: "migrations/", kind: "dir" },
  { depth: 1, name: "src/", kind: "dir" },
  { depth: 2, name: "api/", kind: "dir" },
  { depth: 2, name: "db/", kind: "dir" },
  { depth: 2, name: "workers/", kind: "dir" },
  { depth: 1, name: "tests/", kind: "dir" },
  { depth: 1, name: "package.json", kind: "file" },
  { depth: 1, name: "tsconfig.json", kind: "file" },
  { depth: 1, name: "README.md", kind: "file" },
  { depth: 1, name: "AGENTS.md", kind: "file", surface: true, mark: true },
  { depth: 1, name: "memory/", kind: "dir", surface: true, mark: true },
  { depth: 2, name: "goal.md", kind: "file", surface: true },
  { depth: 2, name: "decisions.md", kind: "file", surface: true },
  { depth: 2, name: "state.md", kind: "file", surface: true },
  { depth: 1, name: "tasks/", kind: "dir", surface: true, mark: true },
  { depth: 2, name: "README.md", kind: "file", surface: true },
  { depth: 2, name: "01-idempotent-retries.md", kind: "file", surface: true },
];

export const treeLabel = "That’s it. It’s all just markdown.";

/** Screen-reader alternative for the tree. */
export const treeTranscript = [
  "A repository layout. agsync reads only AGENTS.md, memory/ and tasks/ — everything else is dimmed.",
  ...tree.map(
    (r) => `${"  ".repeat(r.depth)}${r.name}${r.mark ? " (read by agsync)" : ""}`,
  ),
].join("\n");
