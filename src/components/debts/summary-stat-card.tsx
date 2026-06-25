import { View } from "react-native";

import { StyleSheet } from "react-native-unistyles";

import { Text } from "@/components/ui/text";

type SummaryStatCardProps = {
  label: string;
  value: string;
  color: string;
};

export function SummaryStatCard({ label, value, color }: SummaryStatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={[styles.label, { color }]}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
}));
