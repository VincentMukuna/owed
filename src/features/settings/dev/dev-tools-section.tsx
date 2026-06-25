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
      "Reset database?",
      "Deletes all debts, activity, reminders, and saved settings. OS notification permission is unchanged.",
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
            Simulate ~18 months of usage: {SEED_PEOPLE_COUNT} people, {SEED_DEBT_COUNT} debts, and{" "}
            {SEED_PAYMENT_ACTIVITY_COUNT} payment activities spread over time.
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
            Set the reminder time a few minutes ahead, then seed {SEED_REMINDER_TEST_COUNT}{" "}
            due-today and {SEED_REMINDER_TEST_COUNT} overdue debts (due yesterday). Each bucket
            collapses to one grouped notification at that time. Overdue reminders are turned on if
            needed.
          </Text>
          <Button
            disabled={seedReminderTest.isPending}
            fullWidth
            onPress={() => seedReminderTest.mutate()}
            variant="secondary"
          >
            {seedReminderTest.isPending ? "Seeding…" : "Seed grouped reminder test"}
          </Button>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.content}>
          <Text style={styles.description}>
            Wipe all local data (debts, activity, reminders, and settings) and cancel pending
            notifications. Same as a fresh install without reinstalling the app.
          </Text>
          <Button
            disabled={resetDatabase.isPending}
            fullWidth
            onPress={confirmReset}
            variant="secondary"
          >
            {resetDatabase.isPending ? "Resetting…" : "Reset database"}
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
