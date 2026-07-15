import { Text, View } from "react-native";

import { CalendarDays, ChevronRight } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { HomeSection, HomeSurface } from "@/features/dashboard/components/home-section";
import type { HomeUpcomingSummary } from "@/features/debts/lib/debt-list-utils";
import { formatDueDate } from "@/features/debts/lib/format-dates";
import { formatCurrency } from "@/lib/utils/formatters";

type HomeUpcomingSectionProps = {
  onPress: () => void;
  summary: HomeUpcomingSummary;
};

export function HomeUpcomingSection({ onPress, summary }: HomeUpcomingSectionProps) {
  const { theme } = useUnistyles();

  return (
    <HomeSection title="Upcoming">
      <HomeSurface>
        <PressableScale onPress={onPress} style={styles.pressable}>
          <View style={styles.summaryRow}>
            <View style={styles.icon}>
              <CalendarDays color={theme.colors.primary} size={18} strokeWidth={2} />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryTitle}>Next 7 days</Text>
              <Text style={styles.summaryMeta}>
                {summary.count} {summary.count === 1 ? "promise" : "promises"} through{" "}
                {formatDueDate(summary.throughDate)}
              </Text>
            </View>
            <ChevronRight color={theme.colors.iconMuted} size={17} strokeWidth={2} />
          </View>

          <View style={styles.totals}>
            <View style={styles.total}>
              <Text style={styles.totalLabel}>Coming in</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.totalAmount}>
                {formatCurrency(summary.owedToYou)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.total}>
              <Text style={styles.totalLabel}>Going out</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.totalAmount}>
                {formatCurrency(summary.youOwe)}
              </Text>
            </View>
          </View>
        </PressableScale>
      </HomeSurface>
    </HomeSection>
  );
}

const styles = StyleSheet.create((theme) => ({
  pressable: {
    padding: 16,
    gap: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primarySoft,
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  summaryTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: theme.colors.text,
  },
  summaryMeta: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.muted,
  },
  totals: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.listDivider,
  },
  total: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  totalAmount: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.listDivider,
  },
}));
