/**
 * Single source of truth for anything that points outside the page.
 * If the repo moves, this is the only file that changes.
 */
export const REPO = "gabrielft-me/agsync";

export const links = {
  repo: `https://github.com/${REPO}`,
  stars: `https://github.com/${REPO}/stargazers`,
  issues: `https://github.com/${REPO}/issues`,
  goodFirstIssues: `https://github.com/${REPO}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`,
  newRule: `https://github.com/${REPO}/issues/new?labels=rule-proposal&template=rule-proposal.md`,
  contributing: `https://github.com/${REPO}/blob/main/CONTRIBUTING.md`,
  license: `https://github.com/${REPO}/blob/main/LICENSE`,
  readme: `https://github.com/${REPO}#readme`,
  pypi: "https://pypi.org/project/agsync/",
  author: "https://github.com/gabrielft-me",
  x: "https://x.com/gabrielft_me",
} as const;

export const INSTALL_CMD = "uvx agsync check";
export const REPO_CMD = "uvx agsync check ~/your-repo";

export const meta = {
  title: "agsync — ESLint for your agents' memory",
  description:
    "The decision log your AI agents read at boot is already lying to them. agsync finds out before the next session does. MIT, zero dependencies, Python 3.11+.",
} as const;
