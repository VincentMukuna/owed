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

function realisticSeedProfile(): SeedProfile {
  return {
    peopleCount: REALISTIC_SEED_PEOPLE_COUNT,
    debtCount: REALISTIC_SEED_DEBT_COUNT,
    paymentCount: REALISTIC_SEED_PAYMENT_COUNT,
    usageWindowMonths: REALISTIC_USAGE_WINDOW_MONTHS,
    debtAmounts: REALISTIC_DEBT_AMOUNTS,
    currency: "USD",
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
  seedKey?: string;
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

type SeedPayment = {
  id: string;
  debtId: string;
  personId: string;
  amount: number;
  paidAt: string;
  note: string | null;
  createdAt: string;
  eventType: "payment_recorded" | "debt_paid";
};

type RealisticDebtSpec = {
  key: string;
  personIndex: number;
  direction: DebtDirection;
  amount: number;
  reason: string;
  dueInDays: number;
  createdDaysAgo: number;
  reminder?: boolean;
};

type RealisticPaymentSpec = {
  debtKey: string;
  amount: number;
  hoursAgo: number;
  note?: string;
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

const REALISTIC_PEOPLE = [
  { name: "Olivia Bennett", phoneNumber: "+1 202 555 0101" },
  { name: "James Carter", phoneNumber: "+1 202 555 0102" },
  { name: "Sophia Reed", phoneNumber: "+1 202 555 0103" },
  { name: "Daniel Brooks", phoneNumber: "+1 202 555 0104" },
  { name: "Emma Collins", phoneNumber: "+1 202 555 0105" },
  { name: "Sarah Mitchell", phoneNumber: "+1 202 555 0106" },
  { name: "Michael Turner", phoneNumber: "+1 202 555 0107" },
  { name: "Kevin Parker", phoneNumber: "+1 202 555 0108" },
] as const;

const REALISTIC_DEBT_SPECS: readonly RealisticDebtSpec[] = [
  {
    key: "amina-groceries",
    personIndex: 0,
    direction: "they_owe_me",
    amount: 85,
    reason: "Groceries",
    dueInDays: -9,
    createdDaysAgo: 70,
    reminder: true,
  },
  {
    key: "amina-trip",
    personIndex: 0,
    direction: "they_owe_me",
    amount: 120,
    reason: "Weekend trip",
    dueInDays: 2,
    createdDaysAgo: 45,
    reminder: true,
  },
  {
    key: "amina-tickets",
    personIndex: 0,
    direction: "they_owe_me",
    amount: 60,
    reason: "Concert tickets",
    dueInDays: 28,
    createdDaysAgo: 35,
  },
  {
    key: "amina-settled",
    personIndex: 0,
    direction: "they_owe_me",
    amount: 25,
    reason: "Lunch",
    dueInDays: -25,
    createdDaysAgo: 90,
  },
  {
    key: "james-rent",
    personIndex: 1,
    direction: "they_owe_me",
    amount: 150,
    reason: "Rent share",
    dueInDays: -4,
    createdDaysAgo: 110,
    reminder: true,
  },
  {
    key: "james-lunch",
    personIndex: 1,
    direction: "they_owe_me",
    amount: 18,
    reason: "Lunch",
    dueInDays: 1,
    createdDaysAgo: 12,
    reminder: true,
  },
  {
    key: "james-gift",
    personIndex: 1,
    direction: "they_owe_me",
    amount: 40,
    reason: "Birthday gift",
    dueInDays: 35,
    createdDaysAgo: 25,
  },
  {
    key: "james-settled",
    personIndex: 1,
    direction: "they_owe_me",
    amount: 60,
    reason: "Group gift",
    dueInDays: -15,
    createdDaysAgo: 80,
  },
  {
    key: "wanjiku-utilities",
    personIndex: 2,
    direction: "they_owe_me",
    amount: 40,
    reason: "Phone bill",
    dueInDays: 0,
    createdDaysAgo: 20,
    reminder: true,
  },
  {
    key: "wanjiku-school",
    personIndex: 2,
    direction: "they_owe_me",
    amount: 100,
    reason: "Sports tickets",
    dueInDays: 20,
    createdDaysAgo: 32,
  },
  {
    key: "wanjiku-settled",
    personIndex: 2,
    direction: "they_owe_me",
    amount: 50,
    reason: "Dinner split",
    dueInDays: -8,
    createdDaysAgo: 60,
  },
  {
    key: "brian-hotel",
    personIndex: 3,
    direction: "they_owe_me",
    amount: 100,
    reason: "Hotel share",
    dueInDays: 4,
    createdDaysAgo: 25,
  },
  {
    key: "brian-dinner",
    personIndex: 3,
    direction: "they_owe_me",
    amount: 35,
    reason: "Dinner split",
    dueInDays: 6,
    createdDaysAgo: 16,
  },
  {
    key: "brian-coffee",
    personIndex: 3,
    direction: "they_owe_me",
    amount: 10,
    reason: "Coffee run",
    dueInDays: -12,
    createdDaysAgo: 40,
  },
  {
    key: "brian-settled",
    personIndex: 3,
    direction: "they_owe_me",
    amount: 75,
    reason: "Movie night",
    dueInDays: -30,
    createdDaysAgo: 90,
  },
  {
    key: "grace-groceries",
    personIndex: 4,
    direction: "i_owe_them",
    amount: 25,
    reason: "Groceries",
    dueInDays: 3,
    createdDaysAgo: 18,
    reminder: true,
  },
  {
    key: "grace-concert",
    personIndex: 4,
    direction: "i_owe_them",
    amount: 75,
    reason: "Concert tickets",
    dueInDays: 18,
    createdDaysAgo: 35,
  },
  {
    key: "grace-settled",
    personIndex: 4,
    direction: "i_owe_them",
    amount: 35,
    reason: "Gas money",
    dueInDays: -50,
    createdDaysAgo: 100,
  },
  {
    key: "sarah-weekend",
    personIndex: 5,
    direction: "i_owe_them",
    amount: 60,
    reason: "Weekend trip",
    dueInDays: 7,
    createdDaysAgo: 30,
    reminder: true,
  },
  {
    key: "sarah-birthday",
    personIndex: 5,
    direction: "they_owe_me",
    amount: 30,
    reason: "Birthday gift",
    dueInDays: 45,
    createdDaysAgo: 20,
  },
  {
    key: "daniel-rent",
    personIndex: 6,
    direction: "i_owe_them",
    amount: 100,
    reason: "Rent share",
    dueInDays: 14,
    createdDaysAgo: 40,
  },
  {
    key: "daniel-taxi",
    personIndex: 6,
    direction: "they_owe_me",
    amount: 15,
    reason: "Uber ride",
    dueInDays: 21,
    createdDaysAgo: 15,
  },
  {
    key: "kevin-coffee",
    personIndex: 7,
    direction: "they_owe_me",
    amount: 10,
    reason: "Coffee run",
    dueInDays: -2,
    createdDaysAgo: 15,
  },
  {
    key: "kevin-movie",
    personIndex: 7,
    direction: "they_owe_me",
    amount: 20,
    reason: "Movie night",
    dueInDays: -40,
    createdDaysAgo: 70,
  },
] as const;

const REALISTIC_PAYMENT_SPECS: readonly RealisticPaymentSpec[] = [
  { debtKey: "grace-settled", amount: 35, hoursAgo: 1_440, note: "Paid back in full" },
  { debtKey: "brian-settled", amount: 25, hoursAgo: 960 },
  { debtKey: "kevin-movie", amount: 20, hoursAgo: 840 },
  { debtKey: "amina-settled", amount: 25, hoursAgo: 480 },
  { debtKey: "brian-coffee", amount: 10, hoursAgo: 240 },
  { debtKey: "grace-concert", amount: 25, hoursAgo: 192, note: "First instalment" },
  { debtKey: "wanjiku-settled", amount: 50, hoursAgo: 168 },
  { debtKey: "daniel-rent", amount: 20, hoursAgo: 144 },
  { debtKey: "amina-tickets", amount: 10, hoursAgo: 120 },
  { debtKey: "james-rent", amount: 50, hoursAgo: 96, note: "Part of the rent share" },
  { debtKey: "amina-trip", amount: 20, hoursAgo: 72, note: "Sent the first part" },
  { debtKey: "james-settled", amount: 60, hoursAgo: 68 },
  { debtKey: "sarah-weekend", amount: 15, hoursAgo: 48, note: "Trip deposit" },
  { debtKey: "brian-settled", amount: 50, hoursAgo: 38, note: "Balance cleared" },
  { debtKey: "wanjiku-utilities", amount: 10, hoursAgo: 6, note: "Part payment" },
  { debtKey: "kevin-coffee", amount: 10, hoursAgo: 2, note: "All sorted" },
] as const;

function dateDaysFromNow(now: Date, days: number): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 12);
}

function buildRealisticPeople(now: Date): SeedPerson[] {
  return REALISTIC_PEOPLE.map((person, index) => {
    const createdAt = toISODateTime(
      new Date(now.getTime() - (420 - index * 18) * 24 * 60 * 60 * 1000),
    );
    return {
      id: createId(),
      name: person.name,
      phoneNumber: person.phoneNumber,
      notes: null,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

function buildRealisticDebts(people: SeedPerson[], now: Date): SeedDebt[] {
  return REALISTIC_DEBT_SPECS.map((spec) => {
    const createdAt = toISODateTime(
      new Date(now.getTime() - spec.createdDaysAgo * 24 * 60 * 60 * 1000),
    );
    return {
      id: createId(),
      seedKey: spec.key,
      personId: people[spec.personIndex].id,
      direction: spec.direction,
      originalAmount: spec.amount,
      reason: spec.reason,
      dueDate: toISODate(dateDaysFromNow(now, spec.dueInDays)),
      lentDate: toISODate(new Date(createdAt)),
      reminderEnabled: spec.reminder ? 1 : 0,
      reminderTime: spec.reminder ? APP_CONFIG.defaultReminderTime : null,
      archivedAt: null,
      createdAt,
      updatedAt: createdAt,
      remaining: spec.amount,
    };
  });
}

function buildRealisticPayments(debts: SeedDebt[], now: Date): SeedPayment[] {
  const debtsByKey = new Map(debts.map((debt) => [debt.seedKey, debt]));

  return REALISTIC_PAYMENT_SPECS.map((spec) => {
    const debt = debtsByKey.get(spec.debtKey);
    if (!debt) {
      throw new Error(`Missing realistic seed debt: ${spec.debtKey}`);
    }

    const amount = spec.amount;
    debt.remaining = Math.max(0, debt.remaining - amount);
    const paidAt = toISODateTime(new Date(now.getTime() - spec.hoursAgo * 60 * 60 * 1000));
    return {
      id: createId(),
      debtId: debt.id,
      personId: debt.personId,
      amount,
      paidAt,
      note: spec.note ?? null,
      createdAt: paidAt,
      eventType: debt.remaining <= 0 ? "debt_paid" : "payment_recorded",
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
): SeedPayment[] {
  const eligibleDebts = debts.filter((debt) => !debt.archivedAt && debt.remaining > 0);
  const payments: SeedPayment[] = [];

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

async function seedUsage(
  profile: SeedProfile,
  realistic = false,
  now: Date = new Date(),
): Promise<SeedResult> {
  const db = await getDb();
  const start = usageStart(now, profile.usageWindowMonths);
  const people = realistic
    ? buildRealisticPeople(now)
    : buildPeople(now, start, profile.peopleCount);
  const debts = realistic
    ? buildRealisticDebts(people, now)
    : buildDebts(people, now, profile.debtCount, profile.debtAmounts);
  const payments = realistic
    ? buildRealisticPayments(debts, now)
    : buildPayments(debts, now, profile.paymentCount, profile.debtAmounts);

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

export function simulateRealisticUsage(now: Date = new Date()): Promise<SeedResult> {
  return seedUsage(realisticSeedProfile(), true, now);
}
