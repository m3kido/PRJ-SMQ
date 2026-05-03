type DateLike = Date | string | number | null | undefined;

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const displayDatePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseDate(value: DateLike) {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === "string") {
    const dateOnlyMatch = value.match(dateOnlyPattern);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: DateLike, fallback = "") {
  const date = parseDate(value);
  if (!date) return fallback;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatDateTime(value: DateLike, fallback = "") {
  const date = parseDate(value);
  if (!date) return fallback;
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function isoToDisplayDate(value: string | null | undefined) {
  if (!value) return "";
  const isoMatch = value.match(dateOnlyPattern);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
  }
  return value;
}

export function displayDateToIso(value: string) {
  const trimmed = value.trim();
  const displayMatch = trimmed.match(displayDatePattern);
  if (displayMatch) {
    const [, day, month, year] = displayMatch;
    return `${year}-${month}-${day}`;
  }
  return trimmed;
}
