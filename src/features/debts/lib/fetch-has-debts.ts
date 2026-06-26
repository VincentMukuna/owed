import { debtRepository } from "@/features/debts/repositories/debt-repository";

export function fetchHasDebts() {
  return debtRepository.hasAnyDebts();
}
