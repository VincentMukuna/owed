import { memo, useCallback, useState } from "react";

import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { FlashList } from "@shopify/flash-list";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { Avatar } from "@/components/ui/avatar";
import {
  HOME_PAGE_PADDING,
  HomeCarouselPagination,
  HomeSection,
} from "@/features/dashboard/components/home-section";
import { type DebtAction, DebtActionsMenu } from "@/features/debts/components/debt-actions-menu";
import type { HomeUpcomingSummary } from "@/features/debts/lib/debt-list-utils";
import { formatDueDate } from "@/features/debts/lib/format-dates";
import type { DebtCardView } from "@/features/debts/view-models";
import { formatCurrency } from "@/lib/utils/formatters";

const CARD_GAP = 12;

type HomeUpcomingSectionProps = {
  onDebtAction: (action: DebtAction, debt: DebtCardView) => void;
  onDebtPress: (debtId: string) => void;
  summary: HomeUpcomingSummary;
};

export function HomeUpcomingSection({
  onDebtAction,
  onDebtPress,
  summary,
}: HomeUpcomingSectionProps) {
  const { width } = useWindowDimensions();
  const cardWidth = width - HOME_PAGE_PADDING * 2;
  const [activeIndex, setActiveIndex] = useState(0);

  const renderItem = useCallback(
    ({ item }: { item: DebtCardView }) => (
      <UpcomingDebtCard
        debt={item}
        onAction={onDebtAction}
        onPress={() => onDebtPress(item.id)}
        width={cardWidth}
      />
    ),
    [cardWidth, onDebtAction, onDebtPress],
  );

  const keyExtractor = useCallback((debt: DebtCardView) => debt.id, []);
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + CARD_GAP));
      setActiveIndex(Math.max(0, Math.min(nextIndex, summary.debts.length - 1)));
    },
    [cardWidth, summary.debts.length],
  );

  return (
    <HomeSection title="Upcoming">
      <View style={styles.carouselGroup}>
        <FlashList
          data={summary.debts}
          decelerationRate="fast"
          disableIntervalMomentum
          horizontal
          ItemSeparatorComponent={UpcomingCardSeparator}
          keyExtractor={keyExtractor}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={cardWidth + CARD_GAP}
          style={styles.carousel}
        />
        <HomeCarouselPagination activeIndex={activeIndex} count={summary.debts.length} />
      </View>
    </HomeSection>
  );
}

type UpcomingDebtCardProps = {
  debt: DebtCardView;
  onAction: (action: DebtAction, debt: DebtCardView) => void;
  onPress: () => void;
  width: number;
};

const UpcomingDebtCard = memo(({ debt, onAction, onPress, width }: UpcomingDebtCardProps) => {
  const { theme } = useUnistyles();
  const DirectionIcon = debt.direction === "they_owe_me" ? ArrowDownLeft : ArrowUpRight;
  const directionColor =
    debt.direction === "they_owe_me" ? theme.colors.success : theme.colors.danger;
  const directionLabel = debt.direction === "they_owe_me" ? "Coming in" : "Going out";
  const progress = debt.amount > 0 ? ((debt.amount - debt.remaining) / debt.amount) * 100 : 0;

  const content = (
    <PressableScale onPress={onPress} style={[styles.card, { width }]}>
      <View style={styles.cardHeader}>
        <Avatar
          initials={debt.initials}
          progress={debt.status === "partial" ? progress : undefined}
          size="md"
          status={debt.status}
        />
        <View style={styles.identity}>
          <Text numberOfLines={1} style={styles.name}>
            {debt.name}
          </Text>
          <View style={styles.directionRow}>
            <DirectionIcon color={directionColor} size={13} strokeWidth={2.4} />
            <Text style={[styles.direction, { color: directionColor }]}>{directionLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.amountDueRow}>
        <View style={styles.amountBlock}>
          <Text adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={styles.amount}>
            {formatCurrency(debt.remaining, debt.currency)}
          </Text>
          <Text numberOfLines={1} style={styles.reason}>
            {debt.reason || "Personal debt"}
          </Text>
        </View>
        <View style={styles.dueBlock}>
          <Text style={styles.dueLabel}>Due</Text>
          <Text style={styles.dueDate}>{formatDueDate(debt.dueDateISO)}</Text>
        </View>
      </View>
    </PressableScale>
  );

  return (
    <DebtActionsMenu debt={debt} onAction={onAction} openOnLongPress>
      {content}
    </DebtActionsMenu>
  );
});

UpcomingDebtCard.displayName = "UpcomingDebtCard";

function UpcomingCardSeparator() {
  return <View style={styles.cardSeparator} />;
}

const styles = StyleSheet.create((theme) => ({
  carouselGroup: {
    gap: 8,
  },
  carousel: {
    height: 144,
    overflow: "visible",
  },
  card: {
    height: 144,
    padding: 14,
    justifyContent: "space-between",
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.name === "light" ? theme.colors.borderStrong : theme.colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: theme.colors.text,
  },
  directionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  direction: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
  },
  amountBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  amount: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "700",
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
  },
  reason: {
    fontSize: 11,
    lineHeight: 15,
    color: theme.colors.muted,
  },
  amountDueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  dueBlock: {
    flexShrink: 0,
    alignItems: "flex-end",
    gap: 1,
  },
  dueLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  dueDate: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    color: theme.colors.text,
  },
  cardSeparator: {
    width: CARD_GAP,
  },
}));
