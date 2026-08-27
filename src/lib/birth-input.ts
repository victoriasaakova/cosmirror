export function formatBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}.${month}`;
  return `${day}.${month}.${year}`;
}

export function toIsoDate(value: string): string | null {
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
      return null;
    }
    return v;
  }
  const match = v.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isoToDisplayDate(raw?: string | null): string {
  if (!raw) return "";
  const iso = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  }
  return raw;
}

export function formatBirthDateLabel(raw?: string | null): string {
  if (!raw) return "не указана";
  const iso = raw.slice(0, 10);
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatBirthTimeLabel(raw?: string | null): string {
  if (!raw) return "не указано";
  return raw.slice(0, 5);
}
