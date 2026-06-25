import { useMutation, useQueryClient } from "@tanstack/react-query";

import { reminderRepository } from "@/features/reminders/repositories/reminder-repository";

import { reminderKeys } from "./query-keys";

export function useMarkInboxRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => reminderRepository.markAllInboxRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });
}
