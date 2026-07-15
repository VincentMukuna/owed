import { useCallback, useMemo, useState } from "react";

import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { FlashList } from "@shopify/flash-list";
import { ChevronRight, CircleAlert, CircleCheck, Scale } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { HomeCarouselPagination, HomeSection } from "@/features/dashboard/components/home-section";
import { formatCurrency } from "@/lib/utils/formatters";

const CARD_GAP = 12;
const HOME_PAGE_PADDING = 20;

type InsightItem = {
  accent: "brand" | "success" | "warning";
  copy: string;
  id: "attention" | "net" | "settled";
  label: string;
  onPress: () => void;
  value: string;
};

type HomeInsightsSectionProps = {
  activeCount: number;
  attentionCount: number;
  owedToYou: number;
  paidThisMonth: number;
  youOwe: number;
  onActivePress: () => void;
  onAttentionPress: () => void;
  onDirectionPress: (direction: "they_owe_me" | "i_owe_them") => void;
  onSettledPress: () => void;
};

export function HomeInsightsSection({
  activeCount,
  attentionCount,
  owedToYou,
  paidThisMonth,
  youOwe,
  onActivePress,
  onAttentionPress,
  onDirectionPress,
  onSettledPress,
}: HomeInsightsSectionProps) {
  const { width } = useWindowDimensions();
  const cardWidth = width - HOME_PAGE_PADDING * 2;
  const [activeIndex, setActiveIndex] = useState(0);
  const net = owedToYou - youOwe;

  const insights = useMemo<InsightItem[]>(() => {
    const netDirection = net >= 0 ? "they_owe_me" : "i_owe_them";
    const netCopy =
      net > 0
        ? "More is coming in than going out"
        : net < 0
          ? "More is going out than coming in"
          : "Your open balances are even";

    return [
      {
        accent: "brand",
        id: "net",
        label: "Net position",
        value: formatCurrency(Math.abs(net)),
        copy: netCopy,
        onPress: () => onDirectionPress(netDirection),
      },
      {
        accent: attentionCount === 0 ? "brand" : "warning",
        id: "attention",
        label: "Needs attention",
        value:
          attentionCount === 0
            ? "All clear"
            : `${attentionCount} ${attentionCount === 1 ? "debt" : "debts"}`,
        copy:
          attentionCount === 0
            ? `${activeCount} active ${activeCount === 1 ? "debt" : "debts"}`
            : "Due soon or past the due date",
        onPress: attentionCount === 0 ? onActivePress : onAttentionPress,
      },
      {
        accent: "success",
        id: "settled",
        label: "Settled this month",
        value: formatCurrency(paidThisMonth),
        copy: "Value cleared from settled debts",
        onPress: onSettledPress,
      },
    ];
  }, [
    activeCount,
    attentionCount,
    net,
    onActivePress,
    onAttentionPress,
    onDirectionPress,
    onSettledPress,
    paidThisMonth,
  ]);

  const renderItem = useCallback(
    ({ item }: { item: InsightItem }) => <InsightCard insight={item} width={cardWidth} />,
    [cardWidth],
  );
  const keyExtractor = useCallback((item: InsightItem) => item.id, []);
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + CARD_GAP));
      setActiveIndex(Math.max(0, Math.min(nextIndex, insights.length - 1)));
    },
    [cardWidth, insights.length],
  );

  return (
    <HomeSection title="Insights">
      <View style={styles.carouselGroup}>
        <FlashList
          data={insights}
          decelerationRate="fast"
          disableIntervalMomentum
          horizontal
          ItemSeparatorComponent={InsightCardSeparator}
          keyExtractor={keyExtractor}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={cardWidth + CARD_GAP}
          style={styles.carousel}
        />
        <HomeCarouselPagination activeIndex={activeIndex} count={insights.length} />
      </View>
    </HomeSection>
  );
}

function InsightCard({ insight, width }: { insight: InsightItem; width: number }) {
  const { theme } = useUnistyles();
  const palette =
    insight.accent === "success"
      ? { background: theme.colors.paidSurface, foreground: theme.colors.paidText }
      : insight.accent === "warning"
        ? {
            background: theme.colors.status["due-soon"].bg,
            foreground: theme.colors.status["due-soon"].text,
          }
        : { background: theme.colors.primarySoft, foreground: theme.colors.primary };
  const Icon =
    insight.id === "net" ? Scale : insight.id === "attention" ? CircleAlert : CircleCheck;

  return (
    <PressableScale onPress={insight.onPress} style={[styles.card, { width }]}>
      <View
        pointerEvents="none"
        style={[styles.accentWash, { backgroundColor: palette.background }]}
      />
      <View style={styles.cardHeader}>
        <View style={styles.labelRow}>
          <View style={[styles.iconTile, { backgroundColor: palette.background }]}>
            <Icon color={palette.foreground} size={14} strokeWidth={2.2} />
          </View>
          <Text style={[styles.label, { color: palette.foreground }]}>{insight.label}</Text>
        </View>
        <ChevronRight color={theme.colors.iconMuted} size={16} strokeWidth={2} />
      </View>
      <View style={styles.cardBody}>
        <Text adjustsFontSizeToFit numberOfLines={1} selectable style={styles.value}>
          {insight.value}
        </Text>
        <Text numberOfLines={1} style={styles.copy}>
          {insight.copy}
        </Text>
      </View>
    </PressableScale>
  );
}

function InsightCardSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create((theme) => ({
  carouselGroup: {
    gap: 8,
  },
  carousel: {
    height: 116,
    overflow: "visible",
  },
  card: {
    height: 116,
    padding: 15,
    justifyContent: "space-between",
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.name === "light" ? theme.colors.borderStrong : theme.colors.border,
    overflow: "hidden",
    position: "relative",
  },
  accentWash: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 999,
    top: -46,
    right: -30,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  labelRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconTile: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardBody: {
    minWidth: 0,
    gap: 1,
  },
  value: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "700",
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
  },
  copy: {
    fontSize: 11,
    lineHeight: 15,
    color: theme.colors.muted,
  },
  separator: {
    width: CARD_GAP,
  },
}));
