export type ContactsAnswers = {
  email: string;
  telegram: string;
  pd_consent: boolean;
  offer_consent: boolean;
};

export const EMPTY_CONTACTS: ContactsAnswers = {
  email: "",
  telegram: "",
  pd_consent: false,
  offer_consent: false,
};

export const CONTACTS_SUPPORT =
  "Введи реальные данные — нужно верифицировать Telegram и email";

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalizeTelegram(value: string) {
  let raw = value.trim();
  raw = raw.replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "");
  raw = raw.replace(/^@/, "");
  return raw;
}

export function isValidTelegram(value: string) {
  return /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(normalizeTelegram(value));
}

export function contactsAreValid(contacts: ContactsAnswers) {
  return isValidTelegram(contacts.telegram) && isValidEmail(contacts.email);
}
