import { useMutation, useQueryClient } from "@tanstack/react-query";

import { reminderRepository } from "@/features/reminders/repositories/reminder-repository";

import { reminderKeys } from "./query-keys";

export function useMarkInboxRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => reminderRepository.markAllInboxRead(),
    onMutate: () => {
      queryClient.setQueryData(reminderKeys.unreadCount(), 0);
    },
    onSuccess: async () => {
      // Inbox rows are unchanged when marked read — only the badge matters.
      await queryClient.invalidateQueries({ queryKey: reminderKeys.unreadCount() });
    },
  });
}
