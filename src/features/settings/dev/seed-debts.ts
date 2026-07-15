import { faker } from "@faker-js/faker";

import { APP_CONFIG } from "@/constants/config";
import { toISODate } from "@/features/debts/lib/format-dates";
import { getDb } from "@/lib/db/client";
import { createId } from "@/lib/id";
import type { DebtDirection } from "@/types";

export const SEED_PEOPLE_COUNT = 100;
export const SEED_DEBT_COUNT = 500;
export const SEED_PAYMENT_ACTIVITY_COUNT = 300;
export const REALISTIC_SEED_PEOPLE_COUNT = 8;
export const REALISTIC_SEED_DEBT_COUNT = 24;
export const REALISTIC_SEED_PAYMENT_COUNT = 16;

const USAGE_WINDOW_MONTHS = 18;
const REALISTIC_USAGE_WINDOW_MONTHS = 12;

/** Round amounts typical of informal IOUs — biased toward smaller values. */
const SEED_DEBT_AMOUNTS = [
  10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 125, 130,
  140, 150, 160, 175, 180, 200, 220, 240, 250, 275, 300, 325, 350, 400, 450, 500,
] as const;

/** USD-scale values; records use the app's currently selected currency code. */
const REALISTIC_DEBT_AMOUNTS = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 75, 100, 120, 150] as const;

type SeedProfile = {
  peopleCount: number;
  debtCount: number;
  paymentCount: number;
  usageWindowMonths: number;
  debtAmounts: readonly number[];
  currency: string;
};

const STRESS_SEED_PROFILE: SeedProfile = {
  peopleCount: SEED_PEOPLE_COUNT,
  debtCount: SEED_DEBT_COUNT,
  paymentCount: SEED_PAYMENT_ACTIVITY_COUNT,
  usageWindowMonths: USAGE_WINDOW_MONTHS,
  debtAmounts: SEED_DEBT_AMOUNTS,
  currency: APP_CONFIG.defaultCurrency,
};

function realisticSeedProfile(currency: string): SeedProfile {
  return {
    peopleCount: REALISTIC_SEED_PEOPLE_COUNT,
    debtCount: REALISTIC_SEED_DEBT_COUNT,
    paymentCount: REALISTIC_SEED_PAYMENT_COUNT,
    usageWindowMonths: REALISTIC_USAGE_WINDOW_MONTHS,
    debtAmounts: REALISTIC_DEBT_AMOUNTS,
    currency: currency.toUpperCase(),
  };
}

function randomSeedDebtAmount(amounts: readonly number[]): number {
  const smallEnd = Math.ceil(amounts.length * 0.5);
  const mediumEnd = Math.ceil(amounts.length * 0.75);
  const largeEnd = Math.ceil(amounts.length * 0.9);

  return faker.helpers.weightedArrayElement([
    { weight: 40, value: faker.helpers.arrayElement(amounts.slice(0, smallEnd)) },
    { weight: 35, value: faker.helpers.arrayElement(amounts.slice(smallEnd, mediumEnd)) },
    { weight: 20, value: faker.helpers.arrayElement(amounts.slice(mediumEnd, largeEnd)) },
    { weight: 5, value: faker.helpers.arrayElement(amounts.slice(largeEnd)) },
  ]);
}

function randomSeedPaymentAmount(
  remaining: number,
  isFullPayment: boolean,
  amounts: readonly number[],
): number {
  const minimumPayment = amounts[0];

  if (isFullPayment || remaining <= minimumPayment) {
    return remaining;
  }

  const maxPartial = Math.max(minimumPayment, Math.floor(remaining * 0.85));
  const candidates = amounts.filter((amount) => amount >= minimumPayment && amount <= maxPartial);

  if (candidates.length > 0) {
    return faker.helpers.arrayElement(candidates);
  }

  return Math.max(
    minimumPayment,
    Math.round(faker.number.int({ min: minimumPayment, max: maxPartial }) / minimumPayment) *
      minimumPayment,
  );
}

const SEED_DEBT_REASONS = [
  "Dinner split",
  "Concert tickets",
  "Birthday gift",
  "Groceries",
  "Rent share",
  "Coffee run",
  "Weekend trip",
  "Uber ride",
  "Lunch",
  "Gas money",
  "Hotel share",
  "Movie night",
  "Group gift",
  "Sports tickets",
  "Phone bill",
] as const;

function randomSeedDebtReason(): string {
  return faker.helpers.arrayElement(SEED_DEBT_REASONS);
}

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
  direction: DebtDirection;
  originalAmount: number;
  reason: string;
  dueDate: string;
  lentDate: string | null;
  reminderEnabled: number;
  reminderTime: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  remaining: number;
};

function usageStart(now: Date, months: number): Date {
  const start = new Date(now);
  start.setMonth(start.getMonth() - months);
  return start;
}

function randomBetween(from: Date, to: Date): Date {
  return faker.date.between({ from, to });
}

function toISODateTime(date: Date): string {
  return date.toISOString();
}

function buildPeople(now: Date, start: Date, count: number): SeedPerson[] {
  return Array.from({ length: count }, () => {
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

function seedDebtDirection(index: number): DebtDirection {
  // Keep the sample close to the original lending-heavy app, but guarantee
  // every seed run exercises both directions without depending on chance.
  return index % 4 === 3 ? "i_owe_them" : "they_owe_me";
}

function buildDebts(
  people: SeedPerson[],
  now: Date,
  count: number,
  debtAmounts: readonly number[],
): SeedDebt[] {
  return Array.from({ length: count }, (_, index) => {
    const person = pickPerson(people);
    const personCreatedAt = new Date(person.createdAt);
    const createdAt = randomBetween(personCreatedAt, now);
    const dueDate = new Date(createdAt);
    dueDate.setDate(dueDate.getDate() + faker.number.int({ min: 1, max: 120 }));

    const reminderEnabled = faker.datatype.boolean({ probability: 0.3 });

    return {
      id: createId(),
      personId: person.id,
      direction: seedDebtDirection(index),
      originalAmount: randomSeedDebtAmount(debtAmounts),
      reason: randomSeedDebtReason(),
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
  count: number,
  debtAmounts: readonly number[],
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

  for (let i = 0; i < count; i++) {
    const openDebts = eligibleDebts.filter((debt) => debt.remaining > 0);
    if (openDebts.length === 0) {
      break;
    }

    const debt = faker.helpers.arrayElement(openDebts);
    const debtCreatedAt = new Date(debt.createdAt);
    const paidAt = toISODateTime(randomBetween(debtCreatedAt, now));

    const remainingBefore = debt.remaining;
    const isFullPayment = faker.datatype.boolean({ probability: 0.22 });
    const amount = randomSeedPaymentAmount(remainingBefore, isFullPayment, debtAmounts);

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

async function seedUsage(profile: SeedProfile): Promise<SeedResult> {
  const db = await getDb();
  const now = new Date();
  const start = usageStart(now, profile.usageWindowMonths);
  const people = buildPeople(now, start, profile.peopleCount);
  const debts = buildDebts(people, now, profile.debtCount, profile.debtAmounts);
  const payments = buildPayments(debts, now, profile.paymentCount, profile.debtAmounts);

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
          direction,
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        debt.id,
        debt.personId,
        debt.direction,
        debt.originalAmount,
        profile.currency,
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

export function seedDebts(currency: string = APP_CONFIG.defaultCurrency): Promise<SeedResult> {
  return seedUsage({ ...STRESS_SEED_PROFILE, currency: currency.toUpperCase() });
}

export function simulateRealisticUsage(currency: string): Promise<SeedResult> {
  return seedUsage(realisticSeedProfile(currency));
}
