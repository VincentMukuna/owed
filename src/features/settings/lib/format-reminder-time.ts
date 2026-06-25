import { parseReminderTime } from "@/features/reminders/lib/reminder-scheduler";

export function formatReminderTimeDisplay(time24: string): string {
  const { hours, minutes } = parseReminderTime(time24);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const paddedMinutes = String(minutes).padStart(2, "0");

  return `${hour12}:${paddedMinutes} ${period}`;
}

export function toReminderTime24(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function reminderTimeToDate(time24: string): Date {
  const { hours, minutes } = parseReminderTime(time24);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}
