import { Text, View } from "react-native";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PERSON_STATUS_LABELS, type PersonStatus } from "../lib/person-status";

type PilledStatus = "overdue" | "due-soon" | "settled";

function hasPill(status: PersonStatus): status is PilledStatus {
  return status === "overdue" || status === "due-soon" || status === "settled";
}

function formatBadgeLabel(status: PilledStatus, overdueCount?: number): string {
  if (status === "overdue" && overdueCount && overdueCount > 0) {
    const countLabel = overdueCount >= 10 ? "9+" : String(overdueCount);
    return `${countLabel} Overdue`;
  }
  return PERSON_STATUS_LABELS[status];
}

/** Calm, relationship-first pill. Active and debt-less people show no pill. */
export function PersonStatusBadge({
  status,
  overdueCount,
}: {
  status: PersonStatus;
  overdueCount?: number;
}) {
  const { theme } = useUnistyles();

  if (!hasPill(status)) {
    return null;
  }

  const config = theme.colors.personStatus[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>
        {formatBadgeLabel(status, overdueCount)}
      </Text>
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
