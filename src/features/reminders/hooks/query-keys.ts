export const reminderKeys = {
  all: ["reminders"] as const,
  inbox: () => [...reminderKeys.all, "inbox"] as const,
  unreadCount: () => [...reminderKeys.all, "unread-count"] as const,
};
