import { create } from "zustand";

type UiState = {
  toast: string | null;
  reset: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
};

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUiStore = create<UiState>((set) => ({
  toast: null,

  reset: () => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }

    set({ toast: null });
  },

  showToast: (message) => {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    set({ toast: message });
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
}));
