/**
 * Just enough markdown awareness to render a file as *source* in an editor.
 *
 * Not a renderer: the point is that the visitor sees the plain text they would
 * see in their own editor, with the syntax legible rather than interpreted.
 * Colour stays out of it — the semantic palette means error, warning and pass
 * everywhere else on the page, and spending it on headings here would make
 * those mean less. Weight and brightness carry the structure instead.
 */
export type Kind = "mark" | "text" | "code" | "strong";

export interface Piece {
  t: string;
  k: Kind;
}

export interface Line {
  /** Line-level shape, for the row's own styling. */
  kind: "heading" | "list" | "table" | "blank" | "text";
  pieces: Piece[];
}

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*)/g;

function inline(text: string): Piece[] {
  const pieces: Piece[] = [];

  for (const part of text.split(INLINE)) {
    if (!part) continue;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      pieces.push({ t: "`", k: "mark" });
      pieces.push({ t: part.slice(1, -1), k: "code" });
      pieces.push({ t: "`", k: "mark" });
    } else if (part.startsWith("**") && part.endsWith("**") && part.length > 3) {
      pieces.push({ t: "**", k: "mark" });
      pieces.push({ t: part.slice(2, -2), k: "strong" });
      pieces.push({ t: "**", k: "mark" });
    } else {
      pieces.push({ t: part, k: "text" });
    }
  }

  return pieces;
}

export function source(body: string): Line[] {
  return body.split("\n").map((raw): Line => {
    if (!raw.trim()) return { kind: "blank", pieces: [{ t: " ", k: "text" }] };

    const heading = /^(#{1,6})(\s+)(.*)$/.exec(raw);
    if (heading) {
      return {
        kind: "heading",
        pieces: [
          { t: heading[1]!, k: "mark" },
          { t: heading[2]!, k: "text" },
          ...inline(heading[3]!),
        ],
      };
    }

    const list = /^(\s*)([-*]|\d+\.)(\s+)(.*)$/.exec(raw);
    if (list) {
      return {
        kind: "list",
        pieces: [
          { t: list[1]! + list[2]! + list[3]!, k: "mark" },
          ...inline(list[4]!),
        ],
      };
    }

    if (raw.trimStart().startsWith("|")) {
      return { kind: "table", pieces: [{ t: raw, k: "mark" }] };
    }

    return { kind: "text", pieces: inline(raw) };
  });
}
