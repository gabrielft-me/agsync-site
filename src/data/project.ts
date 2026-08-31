/**
 * The orientation scene: a project, and the handful of markdown files inside
 * it that agsync reads.
 *
 * Authored, unlike scenes.ts — this is an illustration, not the output of a
 * command, and it is drawn without a prompt or an exit code so it cannot be
 * mistaken for one. `my-service` is invented; nothing here is borrowed from a
 * real repository.
 *
 * The files are deliberately short. Each one has to make its point at a glance
 * — a boot protocol that reads as instructions, a decision that records a
 * reason rather than a change, a state file that separates built from
 * verified, a task with a status and a log. Anything that needed scrolling
 * would have failed at the job.
 */
export interface Doc {
  id: string;
  path: string;
  body: string;
}

export interface TreeRow {
  depth: number;
  name: string;
  kind: "dir" | "file";
  /** Present when the row opens a file; absent rows are not selectable. */
  file?: string;
  /** Part of what agsync reads, but a directory: shown, never clickable. */
  surface?: true;
}

export const PROJECT = "my-service";

export const docs: Doc[] = [
  {
    id: "agents",
    path: "AGENTS.md",
    body: `# my-service

## Boot protocol

Before changing anything:

1. \`agsync check --no-baseline\` — if it fails, repair what is
   unambiguous and report the rest. Do not start on memory you
   cannot trust.
2. \`memory/goal.md\` — what this service is for
3. \`memory/decisions.md\` — why it is built the way it is
4. \`memory/state.md\` — what is done, and what is only claimed
5. \`tasks/README.md\` — what is open

## Rules

- Decisions are append-only. Supersede one, never edit it.
- A task is \`done\` only once its Acceptance line has been run.`,
  },
  {
    id: "goal",
    path: "memory/goal.md",
    body: `# Goal

Accept webhooks from payment providers and turn each one into
a ledger entry exactly once.

Success is one number: duplicate ledger entries per million
webhooks delivered. It is currently 0.`,
  },
  {
    id: "decisions",
    path: "memory/decisions.md",
    body: `# Decisions

Append-only. Supersede an entry, never edit it. Every entry
records why, not just what.

## D-014 — Dedupe on the provider's event ID

- **Date:** 2026-08-14
- **Decision:** The worker dedupes on \`event_id\`, not on a
  hash of the payload.
- **Rationale:** Two providers resend the same event with a
  changed \`received_at\`, so payload hashing let duplicates
  through on every retry.
- **Consequences:** \`event_id\` is a unique index now. Events
  arriving without one are rejected at the edge.`,
  },
  {
    id: "state",
    path: "memory/state.md",
    body: `# State

Updated 2026-08-28.

## Built and verified

- Webhook intake and \`event_id\` dedupe.
  Verified: 2M duplicate deliveries replayed, 0 new rows.

## Built, not verified

- Replay endpoint. No test covers a partial replay, so treat
  it as unproven until one does.`,
  },
  {
    id: "tasks-index",
    path: "tasks/README.md",
    body: `# Tasks

The index. Statuses: \`todo\`, \`in-progress\`, \`done\`,
\`superseded\`.

| #  | File                       | Status |
|----|----------------------------|--------|
| 01 | 01-idempotent-retries.md   | done   |`,
  },
  {
    id: "task-01",
    path: "tasks/01-idempotent-retries.md",
    body: `# Task 01 — Idempotent retries

**Status:** done
**Related decisions:** D-014

## Acceptance

Replay 2M duplicate webhooks. The ledger gains no rows.

## Log

- 2026-08-14 — Switched dedupe to \`event_id\`. See D-014.
- 2026-08-27 — Load test green. Marked done.`,
  },
];

/** Opens on the boot protocol: it is the file that explains all the others. */
export const DEFAULT_DOC = "agents";

export const tree: TreeRow[] = [
  { depth: 0, name: `${PROJECT}/`, kind: "dir" },
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
  { depth: 1, name: "AGENTS.md", kind: "file", file: "agents" },
  { depth: 1, name: "memory/", kind: "dir", surface: true },
  { depth: 2, name: "goal.md", kind: "file", file: "goal" },
  { depth: 2, name: "decisions.md", kind: "file", file: "decisions" },
  { depth: 2, name: "state.md", kind: "file", file: "state" },
  { depth: 1, name: "tasks/", kind: "dir", surface: true },
  { depth: 2, name: "README.md", kind: "file", file: "tasks-index" },
  { depth: 2, name: "01-idempotent-retries.md", kind: "file", file: "task-01" },
];

export const treeLabel = "That’s it. It’s all just markdown.";

/** Screen-reader alternative: the shape of the project, then what is readable. */
export const treeTranscript = [
  `A ${PROJECT} repository. agsync reads only the markdown files listed below; the rest of the project is shown dimmed and is not selectable.`,
  ...tree.map((r) => `${"  ".repeat(r.depth)}${r.name}${r.file ? " (selectable)" : ""}`),
].join("\n");
