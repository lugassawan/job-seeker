const LEGAL_SUFFIXES =
  /\b(inc\.?|ltd\.?|llc\.?|gmbh|corp\.?|pte\.?|pvt\.?|pty\.?|co\.?|limited|incorporated|corporation)\b/gi;

export function normalizeCompanyName(name: string): string {
  return name
    .replace(LEGAL_SUFFIXES, "")
    .replace(/[,.\-()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function generateAtsSlugs(name: string): string[] {
  const normalized = normalizeCompanyName(name);
  const words = normalized.split(" ").filter(Boolean);

  const slugs = new Set<string>();

  // hyphenated: "employment-hero"
  slugs.add(words.join("-"));

  // concatenated: "employmenthero"
  slugs.add(words.join(""));

  // first word only: "employment"
  const firstWord = words.at(0);
  if (firstWord && words.length > 1) {
    slugs.add(firstWord);
  }

  return [...slugs];
}
