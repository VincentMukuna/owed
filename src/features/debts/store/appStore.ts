import { create } from 'zustand';

import { INITIAL_ACTIVITIES, INITIAL_DEBTS } from '@/features/debts/data/sampleData';
import type { Activity, Debt, DebtStatus, NewDebt } from '@/features/debts/types';

type AppState = {
  debts: Debt[];
  activities: Activity[];
  toast: string | null;
  reset: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
  addDebt: (debt: NewDebt) => void;
  addPayment: (debtId: number, amount: number, note: string) => void;
  getDebt: (id: number) => Debt | undefined;
};

function getInitialState() {
  return {
    debts: INITIAL_DEBTS.map((debt) => ({ ...debt, payments: [...debt.payments] })),
    activities: [...INITIAL_ACTIVITIES],
    toast: null as string | null,
  };
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useAppStore = create<AppState>((set, get) => ({
  ...getInitialState(),

  reset: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set(getInitialState());
  },

  showToast: (message) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => {
      set({ toast: null });
      toastTimer = null;
    }, 2500);
  },

  clearToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: null });
  },

  getDebt: (id) => get().debts.find((debt) => debt.id === id),

  addDebt: (data) => {
    const newDebt: Debt = {
      ...data,
      id: Date.now(),
      payments: [],
    };
    set((state) => ({ debts: [newDebt, ...state.debts] }));
    get().showToast('Debt saved.');
  },

  addPayment: (debtId, amount, note) => {
    let isFullPayment = false;

    set((state) => ({
      debts: state.debts.map((debt) => {
        if (debt.id !== debtId) return debt;

        isFullPayment = amount >= debt.remaining;
        const newRemaining = Math.max(0, debt.remaining - amount);
        const newStatus: DebtStatus = newRemaining === 0 ? 'paid' : 'partial';
        const newPayment = {
          id: Date.now(),
          amount,
          date: 'Just now',
          note,
        };

        return {
          ...debt,
          remaining: newRemaining,
          status: newStatus,
          payments: [...debt.payments, newPayment],
        };
      }),
    }));

    get().showToast(isFullPayment ? 'Debt marked as paid.' : 'Payment recorded.');
  },
}));
