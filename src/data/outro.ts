/**
 * The closing scene. Authored, like the tree — it is prose in the terminal's
 * chrome, not the output of anything.
 *
 * The heading is the one every landing page fills with logos. Delivered flat:
 * "yet" is the only editorial word on the page and it carries the whole line.
 * The star count under it renders live and is never hidden, including at zero.
 */

/** TODO: the actual event. A named one is more credible than "a hackathon". */
export const VENUE = "a hackathon in San Francisco";

export const outro = {
  label: "The honest part",
  heading: "Trusted by",
  rule: "─".repeat(29),
  answer: "no one, yet",
  lines: [`Built at ${VENUE}.`, "Open sourced because it seemed useful."],
} as const;
