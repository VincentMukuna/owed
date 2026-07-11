import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useUiStore } from "@/features/debts/store/ui-store";
import { reminderRepository } from "@/features/reminders/repositories/reminder-repository";

import { reminderKeys } from "./query-keys";

export function useArchiveInbox() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: () => reminderRepository.archiveInbox(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reminderKeys.all });
      showToast("Inbox cleared.");
    },
    onError: () => {
      showToast("Could not clear inbox. Try again.");
    },
  });
}
