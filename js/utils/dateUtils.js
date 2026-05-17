export function parseDrawDate(dateValue) {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    return Number.isNaN(dateValue.getTime()) ? null : dateValue;
  }

  const text = String(dateValue).trim();

  // Handle YYYY-MM-DD safely as UTC to avoid timezone shifting.
  const ymdMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  // Handle DD/MM/YYYY if needed for Lotterywest CSV.
  const dmyMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateShort(dateValue, locale = "en-AU") {
  const date = parseDrawDate(dateValue);

  if (!date) {
    return String(dateValue ?? "");
  }

  if (locale === "ko-KR") {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateLong(dateValue, locale = "en-AU") {
  const date = parseDrawDate(dateValue);

  if (!date) {
    return String(dateValue ?? "");
  }

  if (locale === "ko-KR") {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}