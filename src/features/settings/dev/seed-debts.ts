import { faker } from "@faker-js/faker";

import { APP_CONFIG } from "@/constants/config";
import { toISODate } from "@/features/debts/lib/format-dates";
import { getDb } from "@/lib/db/client";
import { createId } from "@/lib/id";

export const SEED_PEOPLE_COUNT = 100;
export const SEED_DEBT_COUNT = 500;
export const SEED_PAYMENT_ACTIVITY_COUNT = 300;

const USAGE_WINDOW_MONTHS = 18;

export type SeedResult = {
  people: number;
  debts: number;
  payments: number;
  activities: number;
};

type SeedPerson = {
  id: string;
  name: string;
  phoneNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type SeedDebt = {
  id: string;
  personId: string;
  originalAmount: number;
  reason: string | null;
  dueDate: string;
  lentDate: string | null;
  reminderEnabled: number;
  reminderTime: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  remaining: number;
};

function usageStart(now: Date): Date {
  const start = new Date(now);
  start.setMonth(start.getMonth() - USAGE_WINDOW_MONTHS);
  return start;
}

function randomBetween(from: Date, to: Date): Date {
  return faker.date.between({ from, to });
}

function toISODateTime(date: Date): string {
  return date.toISOString();
}

function buildPeople(now: Date, start: Date): SeedPerson[] {
  return Array.from({ length: SEED_PEOPLE_COUNT }, () => {
    const createdAt = toISODateTime(randomBetween(start, now));

    return {
      id: createId(),
      name: faker.person.fullName(),
      phoneNumber:
        faker.helpers.maybe(() => faker.phone.number({ style: "international" }), {
          probability: 0.4,
        }) ?? null,
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.15 }) ?? null,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

function pickPerson(people: SeedPerson[]): SeedPerson {
  return faker.helpers.weightedArrayElement(
    people.map((person) => ({
      value: person,
      weight: faker.number.int({ min: 1, max: 8 }),
    })),
  );
}

function buildDebts(people: SeedPerson[], now: Date): SeedDebt[] {
  return Array.from({ length: SEED_DEBT_COUNT }, () => {
    const person = pickPerson(people);
    const personCreatedAt = new Date(person.createdAt);
    const createdAt = randomBetween(personCreatedAt, now);
    const dueDate = new Date(createdAt);
    dueDate.setDate(dueDate.getDate() + faker.number.int({ min: 1, max: 120 }));

    const reminderEnabled = faker.datatype.boolean({ probability: 0.3 });

    return {
      id: createId(),
      personId: person.id,
      originalAmount: faker.number.int({ min: 50, max: 3_000 }),
      reason: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.55 }) ?? null,
      dueDate: toISODate(dueDate),
      lentDate:
        faker.helpers.maybe(() => toISODate(randomBetween(personCreatedAt, createdAt)), {
          probability: 0.35,
        }) ?? null,
      reminderEnabled: reminderEnabled ? 1 : 0,
      reminderTime: reminderEnabled ? APP_CONFIG.defaultReminderTime : null,
      archivedAt:
        faker.helpers.maybe(() => toISODateTime(randomBetween(createdAt, now)), {
          probability: 0.08,
        }) ?? null,
      createdAt: toISODateTime(createdAt),
      updatedAt: toISODateTime(createdAt),
      remaining: 0, // set after object creation
    };
  }).map((debt) => ({ ...debt, remaining: debt.originalAmount }));
}

function buildPayments(
  debts: SeedDebt[],
  now: Date,
): {
  id: string;
  debtId: string;
  personId: string;
  amount: number;
  paidAt: string;
  note: string | null;
  createdAt: string;
  eventType: "payment_recorded" | "debt_paid";
}[] {
  const eligibleDebts = debts.filter((debt) => !debt.archivedAt && debt.remaining > 0);
  const payments: {
    id: string;
    debtId: string;
    personId: string;
    amount: number;
    paidAt: string;
    note: string | null;
    createdAt: string;
    eventType: "payment_recorded" | "debt_paid";
  }[] = [];

  for (let i = 0; i < SEED_PAYMENT_ACTIVITY_COUNT; i++) {
    const openDebts = eligibleDebts.filter((debt) => debt.remaining > 0);
    if (openDebts.length === 0) {
      break;
    }

    const debt = faker.helpers.arrayElement(openDebts);
    const debtCreatedAt = new Date(debt.createdAt);
    const paidAt = toISODateTime(randomBetween(debtCreatedAt, now));

    const remainingBefore = debt.remaining;
    const isFullPayment = faker.datatype.boolean({ probability: 0.22 });
    const amount = isFullPayment
      ? remainingBefore
      : faker.number.int({ min: 1, max: Math.max(1, Math.floor(remainingBefore * 0.85)) });

    debt.remaining = Math.max(0, remainingBefore - amount);
    const eventType = debt.remaining <= 0 ? "debt_paid" : "payment_recorded";

    payments.push({
      id: createId(),
      debtId: debt.id,
      personId: debt.personId,
      amount,
      paidAt,
      note: faker.helpers.maybe(() => faker.lorem.words(3), { probability: 0.2 }) ?? null,
      createdAt: paidAt,
      eventType,
    });
  }

  return payments;
}

export async function seedDebts(): Promise<SeedResult> {
  const db = await getDb();
  const now = new Date();
  const start = usageStart(now);
  const people = buildPeople(now, start);
  const debts = buildDebts(people, now);
  const payments = buildPayments(debts, now);

  let activityCount = 0;

  await db.withTransactionAsync(async () => {
    for (const person of people) {
      await db.runAsync(
        `INSERT INTO people (id, name, phone_number, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        person.id,
        person.name,
        person.phoneNumber,
        person.notes,
        person.createdAt,
        person.updatedAt,
      );
    }

    for (const debt of debts) {
      await db.runAsync(
        `INSERT INTO debts (
          id,
          person_id,
          original_amount,
          currency,
          reason,
          due_date,
          lent_date,
          reminder_enabled,
          reminder_time,
          archived_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        debt.id,
        debt.personId,
        debt.originalAmount,
        APP_CONFIG.defaultCurrency,
        debt.reason,
        debt.dueDate,
        debt.lentDate,
        debt.reminderEnabled,
        debt.reminderTime,
        debt.archivedAt,
        debt.createdAt,
        debt.updatedAt,
      );

      await db.runAsync(
        `INSERT INTO activity_events (
          id, type, debt_id, payment_id, person_id, amount, occurred_at, created_at
        ) VALUES (?, 'debt_created', ?, NULL, ?, ?, ?, ?)`,
        createId(),
        debt.id,
        debt.personId,
        debt.originalAmount,
        debt.createdAt,
        debt.createdAt,
      );
      activityCount += 1;
    }

    for (const payment of payments) {
      await db.runAsync(
        `INSERT INTO payments (id, debt_id, amount, paid_at, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        payment.id,
        payment.debtId,
        payment.amount,
        payment.paidAt,
        payment.note,
        payment.createdAt,
      );

      await db.runAsync(
        `INSERT INTO activity_events (
          id, type, debt_id, payment_id, person_id, amount, occurred_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        createId(),
        payment.eventType,
        payment.debtId,
        payment.id,
        payment.personId,
        payment.amount,
        payment.paidAt,
        payment.createdAt,
      );
      activityCount += 1;
    }
  });

  return {
    people: people.length,
    debts: debts.length,
    payments: payments.length,
    activities: activityCount,
  };
}
