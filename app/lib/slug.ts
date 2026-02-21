const GERMAN_MAP: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
  Ä: "Ae",
  Ö: "Oe",
  Ü: "Ue",
};

const GERMAN_RE = /[äöüßÄÖÜ]/g;

export function slugify(name: string): string {
  let s = name.replace(GERMAN_RE, (ch) => GERMAN_MAP[ch] ?? ch);

  // NFKD normalize → strip combining marks → lowercase
  s = s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  // Replace non-alphanumeric with hyphens, collapse, trim
  s = s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return s || "unnamed";
}
