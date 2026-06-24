const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function parseISODateTime(value: string): Date {
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  return parseISODate(value);
}

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const paddedMinutes = String(minutes).padStart(2, "0");

  return `${hour12}:${paddedMinutes} ${period}`;
}

export function formatDueDate(isoDate: string): string {
  const date = parseISODate(isoDate);
  const weekday = WEEKDAY_SHORT[date.getDay()];
  const day = date.getDate();
  const month = MONTH_SHORT[date.getMonth()];

  return `${weekday}, ${day} ${month}`;
}

export function formatAddedDate(isoDateTime: string): string {
  const date = parseISODateTime(isoDateTime);
  const month = MONTH_SHORT[date.getMonth()];
  const day = date.getDate();

  return `${month} ${day}`;
}

export function formatPaymentDate(isoDateTime: string, now: Date = new Date()): string {
  const date = parseISODateTime(isoDateTime);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfPaymentDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = startOfToday.getTime() - startOfPaymentDay.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    return "Just now";
  }

  const month = MONTH_SHORT[date.getMonth()];
  const day = date.getDate();

  return `${month} ${day}, ${formatTime(date)}`;
}

export function formatRelativeTime(isoDateTime: string, now: Date = new Date()): string {
  const date = parseISODateTime(isoDateTime);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfEventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = startOfToday.getTime() - startOfEventDay.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    return `Today, ${formatTime(date)}`;
  }

  const month = MONTH_SHORT[date.getMonth()];
  const day = date.getDate();

  if (date.getHours() !== 0 || date.getMinutes() !== 0) {
    return `${month} ${day}, ${formatTime(date)}`;
  }

  return `${month} ${day}`;
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function resolveQuickDate(label: string, now: Date = new Date()): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (label) {
    case "Today":
      break;
    case "Tomorrow":
      date.setDate(date.getDate() + 1);
      break;
    case "Friday": {
      const day = date.getDay();
      const daysUntilFriday = (5 - day + 7) % 7;
      date.setDate(date.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
      break;
    }
    case "Next week":
      date.setDate(date.getDate() + 7);
      break;
    default:
      break;
  }

  return toISODate(date);
}
