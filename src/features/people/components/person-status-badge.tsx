import { Text, View } from "react-native";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PERSON_STATUS_LABELS, type PersonStatus } from "../lib/person-status";

type PilledStatus = "due-soon" | "settled";

function hasPill(status: PersonStatus): status is PilledStatus {
  return status === "due-soon" || status === "settled";
}

/** Calm, relationship-first pill. Overdue is shown per promise instead. */
export function PersonStatusBadge({ status }: { status: PersonStatus }) {
  const { theme } = useUnistyles();

  if (!hasPill(status)) {
    return null;
  }

  const config = theme.colors.personStatus[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>{PERSON_STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
});
