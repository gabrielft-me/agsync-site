/**
 * The closing scene. Authored, like the project tree — it is prose in the
 * terminal's chrome, not the output of anything.
 *
 * Two facts and a byline. Any more and it becomes an about page, which is a
 * different and worse section. The star count beside it renders live and is
 * never hidden, including at zero.
 */

/** TODO: the actual event. A named one is more credible than "a hackathon". */
export const VENUE = "a hackathon in San Francisco";

/** TODO: the company, if it should be named. Same reasoning as VENUE. */
export const EMPLOYER = "a YC company";

export const outro = {
  label: "The honest part",
  lines: [`Built at ${VENUE}.`, "Open sourced because it seemed useful."],
  by: {
    name: "Gabriel Teixeira",
    note: `previously an AI engineer at ${EMPLOYER}`,
  },
} as const;
