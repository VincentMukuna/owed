import { getDb } from "@/lib/db/client";

export type ConvertCurrencyInput = {
  rate: number;
  toCurrency: string;
};

export async function convertAllAmountsToCurrency(input: ConvertCurrencyInput): Promise<void> {
  const db = await getDb();
  const { rate, toCurrency } = input;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE debts
       SET original_amount = CAST(ROUND(original_amount * ?) AS INTEGER),
           currency = ?`,
      [rate, toCurrency],
    );
    await db.runAsync(
      `UPDATE payments
       SET amount = CAST(ROUND(amount * ?) AS INTEGER)`,
      [rate],
    );
    await db.runAsync(
      `UPDATE activity_events
       SET amount = CAST(ROUND(amount * ?) AS INTEGER)
       WHERE amount IS NOT NULL`,
      [rate],
    );
  });
}
