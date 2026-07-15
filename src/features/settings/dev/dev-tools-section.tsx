import { Alert, Text, View } from "react-native";

import { useRouter } from "expo-router";

import { ChevronRight } from "lucide-react-native";
import { StyleSheet } from "react-native-unistyles";

import { ListInsetDivider } from "@/components/shared/list-inset-divider";
import { PressableScale } from "@/components/shared/pressable-scale";
import { selectionChange } from "@/lib/haptics";

import { useResetDatabase } from "../hooks/use-reset-database";
import { useResetOnboardingState } from "../hooks/use-reset-onboarding-state";
import { useSeedDebts } from "../hooks/use-seed-debts";
import { useSeedReminderTest } from "../hooks/use-seed-reminder-test";
import {
  REALISTIC_SEED_DEBT_COUNT,
  REALISTIC_SEED_PAYMENT_COUNT,
  REALISTIC_SEED_PEOPLE_COUNT,
  SEED_DEBT_COUNT,
  SEED_PAYMENT_ACTIVITY_COUNT,
  SEED_PEOPLE_COUNT,
} from "./seed-debts";
import { SEED_REMINDER_TEST_COUNT } from "./seed-reminder-test";

type DevToolRowProps = {
  icon: string;
  title: string;
  description: string;
  value: string;
  disabled?: boolean;
  bordered?: boolean;
  onPress: () => void;
};

function DevToolRow({
  icon,
  title,
  description,
  value,
  disabled = false,
  bordered = false,
  onPress,
}: DevToolRowProps) {
  return (
    <View>
      {bordered ? <ListInsetDivider leadingInset={44} trailingInset={16} /> : null}
      <PressableScale
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={styles.row}
      >
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.rowCopy}>
          <Text style={styles.label}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={styles.valueWrap}>
          <Text style={styles.value}>{value}</Text>
          <ChevronRight color={styles.chevron.color} size={16} strokeWidth={2} />
        </View>
      </PressableScale>
    </View>
  );
}

export function DevToolsSection() {
  const router = useRouter();
  const seedDebts = useSeedDebts();
  const seedRealisticUsage = useSeedDebts("realistic");
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

  const confirmRealisticSeed = () => {
    selectionChange();
    Alert.alert(
      "Load screenshot dataset?",
      "Replaces all current debts, people, payments, activity, and notifications with a realistic USD dataset designed to show every Home section. Your default currency will switch to USD.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Replace & Load",
          style: "destructive",
          onPress: () => seedRealisticUsage.mutate(),
        },
      ],
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Developer</Text>
      <View style={styles.card}>
        <DevToolRow
          description={`${SEED_PEOPLE_COUNT} people, ${SEED_DEBT_COUNT} debts, ${SEED_PAYMENT_ACTIVITY_COUNT} payments over ~18 months.`}
          disabled={seedDebts.isPending || seedRealisticUsage.isPending}
          icon="🧾"
          onPress={() => seedDebts.mutate()}
          title="Seed stress data"
          value={seedDebts.isPending ? "Seeding" : "Run"}
        />
        <DevToolRow
          bordered
          description={`Replaces current records with ${REALISTIC_SEED_PEOPLE_COUNT} people, ${REALISTIC_SEED_DEBT_COUNT} realistic debts, and ${REALISTIC_SEED_PAYMENT_COUNT} repayments in USD. Shows every Home section.`}
          disabled={seedRealisticUsage.isPending || seedDebts.isPending}
          icon="📸"
          onPress={confirmRealisticSeed}
          title="Load screenshot dataset"
          value={seedRealisticUsage.isPending ? "Seeding" : "Run"}
        />
        <DevToolRow
          bordered
          description={`${SEED_REMINDER_TEST_COUNT} due today and ${SEED_REMINDER_TEST_COUNT} overdue debts for grouped notification QA.`}
          disabled={seedReminderTest.isPending}
          icon="🔔"
          onPress={() => seedReminderTest.mutate()}
          title="Seed reminder test"
          value={seedReminderTest.isPending ? "Seeding" : "Run"}
        />
        <DevToolRow
          bordered
          description="Mark onboarding incomplete and reopen the onboarding flow."
          disabled={resetOnboarding.isPending}
          icon="👋"
          onPress={confirmOnboardingReset}
          title="Reset onboarding"
          value={resetOnboarding.isPending ? "Resetting" : "Reset"}
        />
        <DevToolRow
          bordered
          description="Delete debts, people, payments, activity, and pending notifications."
          disabled={resetDatabase.isPending}
          icon="🧹"
          onPress={confirmReset}
          title="Clear all records"
          value={resetDatabase.isPending ? "Clearing" : "Clear"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.name === "light" ? theme.colors.borderStrong : theme.colors.border,
    overflow: "hidden",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  icon: {
    fontSize: 16,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.muted,
  },
  valueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  value: {
    fontSize: 14,
    color: theme.colors.muted,
  },
  chevron: {
    color: theme.colors.iconMuted,
  },
}));
