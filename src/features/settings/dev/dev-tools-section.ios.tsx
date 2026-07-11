import { Alert } from "react-native";

import { useRouter } from "expo-router";

import type { SFSymbol } from "sf-symbols-typescript";

import { selectionChange } from "@/lib/haptics";

import {
  SettingsSwiftDetailRow,
  SettingsSwiftSection,
} from "../components/settings-swift-list.ios";
import { useResetDatabase } from "../hooks/use-reset-database";
import { useResetOnboardingState } from "../hooks/use-reset-onboarding-state";
import { useSeedDebts } from "../hooks/use-seed-debts";
import { useSeedReminderTest } from "../hooks/use-seed-reminder-test";
import { SEED_DEBT_COUNT, SEED_PAYMENT_ACTIVITY_COUNT, SEED_PEOPLE_COUNT } from "./seed-debts";
import { SEED_REMINDER_TEST_COUNT } from "./seed-reminder-test";

type DevToolRowProps = {
  systemImage: SFSymbol;
  title: string;
  description: string;
  value: string;
  disabled?: boolean;
  onPress: () => void;
};

function DevToolRow({
  systemImage,
  title,
  description,
  value,
  disabled = false,
  onPress,
}: DevToolRowProps) {
  return (
    <SettingsSwiftDetailRow
      description={description}
      disabled={disabled}
      onPress={onPress}
      systemImage={systemImage}
      title={title}
      value={value}
    />
  );
}

export function DevToolsSection() {
  const router = useRouter();
  const seedDebts = useSeedDebts();
  const seedReminderTest = useSeedReminderTest();
  const resetDatabase = useResetDatabase();
  const resetOnboarding = useResetOnboardingState();

  const confirmReset = () => {
    selectionChange();
    Alert.alert(
      "Clear all records?",
      "Deletes all debts, people, payments, activity, and notifications. Your preferences stay unchanged. OS notification permission is unchanged.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetDatabase.mutate();
          },
        },
      ],
    );
  };

  const confirmOnboardingReset = () => {
    selectionChange();
    Alert.alert(
      "Reset onboarding?",
      "Marks onboarding as incomplete and opens the onboarding flow again. Your records and preferences stay unchanged.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetOnboarding.mutate(undefined, {
              onSuccess: () => {
                router.replace("/onboarding");
              },
            });
          },
        },
      ],
    );
  };

  return (
    <SettingsSwiftSection title="Developer">
      <DevToolRow
        description={`${SEED_PEOPLE_COUNT} people, ${SEED_DEBT_COUNT} debts, ${SEED_PAYMENT_ACTIVITY_COUNT} payments over ~18 months.`}
        disabled={seedDebts.isPending}
        onPress={() => seedDebts.mutate()}
        systemImage="doc.text"
        title="Seed sample data"
        value={seedDebts.isPending ? "Seeding" : "Run"}
      />
      <DevToolRow
        description={`${SEED_REMINDER_TEST_COUNT} due today and ${SEED_REMINDER_TEST_COUNT} overdue debts for grouped notification QA.`}
        disabled={seedReminderTest.isPending}
        onPress={() => seedReminderTest.mutate()}
        systemImage="bell.badge"
        title="Seed reminder test"
        value={seedReminderTest.isPending ? "Seeding" : "Run"}
      />
      <DevToolRow
        description="Mark onboarding incomplete and reopen the onboarding flow."
        disabled={resetOnboarding.isPending}
        onPress={confirmOnboardingReset}
        systemImage="hand.wave"
        title="Reset onboarding"
        value={resetOnboarding.isPending ? "Resetting" : "Reset"}
      />
      <DevToolRow
        description="Delete debts, people, payments, activity, and pending notifications."
        disabled={resetDatabase.isPending}
        onPress={confirmReset}
        systemImage="trash"
        title="Clear all records"
        value={resetDatabase.isPending ? "Clearing" : "Clear"}
      />
    </SettingsSwiftSection>
  );
}
