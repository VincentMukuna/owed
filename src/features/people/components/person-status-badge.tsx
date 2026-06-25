import { StyleSheet, Text, View } from "react-native";

import { PERSON_STATUS_LABELS, type PersonStatus } from "../lib/person-status";

type PilledStatus = "overdue" | "due-soon" | "settled";

const CONFIG: Record<PilledStatus, { bg: string; dot: string; text: string }> = {
  overdue: { bg: "#FEF2F2", dot: "#F87171", text: "#DC2626" },
  "due-soon": { bg: "#FFFBEB", dot: "#F59E0B", text: "#B45309" },
  settled: { bg: "#F0FDF4", dot: "#34D399", text: "#15803D" },
};

function hasPill(status: PersonStatus): status is PilledStatus {
  return status === "overdue" || status === "due-soon" || status === "settled";
}

/** Calm, relationship-first pill. Active and debt-less people show no pill. */
export function PersonStatusBadge({ status }: { status: PersonStatus }) {
  if (!hasPill(status)) {
    return null;
  }

  const config = CONFIG[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.label, { color: config.text }]}>{PERSON_STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
});
