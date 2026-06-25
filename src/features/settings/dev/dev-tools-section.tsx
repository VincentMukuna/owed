import { Alert, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/button";

import { useResetDatabase } from "../hooks/use-reset-database";
import { useSeedDebts } from "../hooks/use-seed-debts";
import { useSeedReminderTest } from "../hooks/use-seed-reminder-test";
import { SEED_DEBT_COUNT, SEED_PAYMENT_ACTIVITY_COUNT, SEED_PEOPLE_COUNT } from "./seed-debts";
import { SEED_REMINDER_TEST_COUNT } from "./seed-reminder-test";

export function DevToolsSection() {
  const seedDebts = useSeedDebts();
  const seedReminderTest = useSeedReminderTest();
  const resetDatabase = useResetDatabase();

  const confirmReset = () => {
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

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Developer</Text>
      <View style={styles.card}>
        <View style={styles.content}>
          <Text style={styles.description}>
            Populate sample IOUs for testing and screenshots: {SEED_PEOPLE_COUNT} people,{" "}
            {SEED_DEBT_COUNT} debts, and {SEED_PAYMENT_ACTIVITY_COUNT} payments spread over ~18
            months. Amounts are small round values; every debt includes a short description.
          </Text>
          <Button
            disabled={seedDebts.isPending}
            fullWidth
            onPress={() => seedDebts.mutate()}
            variant="secondary"
          >
            {seedDebts.isPending ? "Seeding…" : "Seed sample data"}
          </Button>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.content}>
          <Text style={styles.description}>
            Notification QA: set your reminder time a few minutes ahead, then seed{" "}
            {SEED_REMINDER_TEST_COUNT} debts due today and {SEED_REMINDER_TEST_COUNT} due yesterday.
            Each bucket collapses into one grouped notification at that time. Overdue reminders are
            turned on if needed.
          </Text>
          <Button
            disabled={seedReminderTest.isPending}
            fullWidth
            onPress={() => seedReminderTest.mutate()}
            variant="secondary"
          >
            {seedReminderTest.isPending ? "Seeding…" : "Seed grouped notification test"}
          </Button>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.content}>
          <Text style={styles.description}>
            Delete all debts, people, payments, activity, and notifications, and cancel pending
            notifications. Your preferences (currency, notification settings, onboarding) stay
            unchanged.
          </Text>
          <Button
            disabled={resetDatabase.isPending}
            fullWidth
            onPress={confirmReset}
            variant="secondary"
          >
            {resetDatabase.isPending ? "Clearing…" : "Clear all records"}
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A8A82",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    gap: 16,
    padding: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#8A8A82",
  },
});
