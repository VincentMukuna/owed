import { create } from "zustand";

export type ToastTone = "default" | "success" | "error";

export type ToastState = {
  message: string;
  tone: ToastTone;
};

type UiState = {
  toast: ToastState | null;
  showToast: (message: string, tone?: ToastTone) => void;
  clearToast: () => void;
  settleCelebrationToken: number;
  triggerSettleCelebration: () => void;
};

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUiStore = create<UiState>((set) => ({
  toast: null,
  settleCelebrationToken: 0,

  showToast: (message, tone = "default") => {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    set({ toast: { message, tone } });
    toastTimer = setTimeout(() => {
      set({ toast: null });
      toastTimer = null;
    }, 2500);
  },

  clearToast: () => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }

    set({ toast: null });
  },

  triggerSettleCelebration: () =>
    set((state) => ({ settleCelebrationToken: state.settleCelebrationToken + 1 })),
}));
