import { z } from "zod";

export const addDebtSchema = z.object({
  direction: z.enum(["they_owe_me", "i_owe_them"]),
  personName: z.string().trim().min(1, "Person name is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  dueDate: z.string().min(1, "Due date is required"),
  reason: z.string().trim().optional(),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().optional(),
});

export type AddDebtFormValues = z.infer<typeof addDebtSchema>;

export const addPaymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  paidAt: z.string().min(1, "Payment date is required"),
  note: z.string().trim().optional(),
});

export type AddPaymentFormValues = z.infer<typeof addPaymentSchema>;
