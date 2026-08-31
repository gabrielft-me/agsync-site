import { REPO } from "../config";

/**
 * Star count, resolved once at build time and embedded in the HTML.
 *
 * Deliberately never a client-side fetch: a button that renders `0` and then
 * corrects itself a moment later is worse than a button with no number on it.
 * If the API is unreachable or the repo is not public yet, we return null and
 * the button renders as a plain "Star on GitHub" — honest, and stable.
 */
let inflight: Promise<number | null> | undefined;

export function getStarCount(): Promise<number | null> {
  // Cache the promise, not the result: several components await this in the
  // same build tick, and caching the result still fires N requests.
  inflight ??= fetchStars();
  return inflight;
}

async function fetchStars(): Promise<number | null> {
  const token = process.env.GITHUB_TOKEN;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "agsync-site",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const data = (await res.json()) as { stargazers_count?: unknown };
    return typeof data.stargazers_count === "number"
      ? data.stargazers_count
      : null;
  } catch (err) {
    console.warn(
      `[agsync-site] star count unavailable (${(err as Error).message}) — rendering the button without a number.`,
    );
    return null;
  }
}

export function formatStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}
