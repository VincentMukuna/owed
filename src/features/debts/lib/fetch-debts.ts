import { toDebtCardView } from "@/features/debts/lib/mappers";
import { debtRepository } from "@/features/debts/repositories/debt-repository";
import type { DebtCardView } from "@/features/debts/view-models";

export async function fetchDebtCardViews(): Promise<DebtCardView[]> {
  const now = new Date();
  const debts = await debtRepository.listSummaries();

  return debts.map((debt) => toDebtCardView(debt, now));
}
