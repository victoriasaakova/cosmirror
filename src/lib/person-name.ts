const NAME_CHAR = /[\p{L}\p{M} \u00A0'\u2019\u02BC-]/u;

/** Keep letters, spaces, hyphen and apostrophe. Drop emoji, digits and symbols. */
export function sanitizePersonNameInput(raw: string): string {
  const next = Array.from(raw.normalize("NFKC"))
    .filter((char) => NAME_CHAR.test(char))
    .join("")
    .replace(/[ \u00A0]{2,}/g, " ");
  return next.slice(0, 40);
}

export function sanitizePersonName(raw: string): string {
  const cleaned = sanitizePersonNameInput(raw).trim();
  if (![...cleaned].some((char) => /\p{L}/u.test(char))) return "";
  return cleaned;
}
