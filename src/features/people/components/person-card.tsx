import { Fragment, memo, type ReactNode } from "react";

import { Text, View } from "react-native";

import { ArrowDownLeft, ArrowUpRight, type LucideIcon } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { formatCurrency } from "@/lib/utils/formatters";

import type { PersonListItemView } from "../view-models";
import { PersonStatusBadge } from "./person-status-badge";

function DirectionSegment({
  icon: Icon,
  color,
  amount,
  promiseCount,
}: {
  icon: LucideIcon;
  color: string;
  amount: number;
  promiseCount: number;
}) {
  return (
    <View style={styles.directionSegment}>
      <Icon color={color} size={12} strokeWidth={2.3} style={styles.directionIcon} />
      <Text style={styles.amount} numberOfLines={1}>
        {formatCurrency(amount)}
        {promiseCount > 0 ? ` (${promiseCount})` : ""}
      </Text>
    </View>
  );
}

function PersonSummaryLine({ person }: { person: PersonListItemView }) {
  const { theme } = useUnistyles();

  if (person.status === "none") {
    return (
      <Text style={styles.sub} numberOfLines={1}>
        No promises yet
      </Text>
    );
  }
  if (person.status === "settled") {
    return (
      <Text style={styles.sub} numberOfLines={1}>
        Settled up
      </Text>
    );
  }

  const segments: ReactNode[] = [];

  if (person.owedToYou > 0) {
    segments.push(
      <DirectionSegment
        key="owed"
        amount={person.owedToYou}
        color={theme.colors.success}
        icon={ArrowDownLeft}
        promiseCount={person.owedToYouOpenCount}
      />,
    );
  }
  if (person.youOwe > 0) {
    segments.push(
      <DirectionSegment
        key="owe"
        amount={person.youOwe}
        color={theme.colors.danger}
        icon={ArrowUpRight}
        promiseCount={person.youOweOpenCount}
      />,
    );
  }

  if (segments.length === 0) {
    return (
      <Text style={styles.sub} numberOfLines={1}>
        {person.openDebtCount} active
      </Text>
    );
  }

  return (
    <View style={styles.summaryRow}>
      {segments.map((segment, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <Text style={styles.separator} numberOfLines={1}>
              {" · "}
            </Text>
          ) : null}
          {segment}
        </Fragment>
      ))}
    </View>
  );
}

type PersonCardProps = {
  person: PersonListItemView;
  onPress: () => void;
};

export const PersonCard = memo(({ person, onPress }: PersonCardProps) => {
  const showBadge = person.status !== "active" && person.status !== "none";

  return (
    <PressableScale onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{person.initials}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {person.name}
          </Text>
          <PersonSummaryLine person={person} />
        </View>
        {showBadge ? (
          <PersonStatusBadge overdueCount={person.overdueCount} status={person.status} />
        ) : null}
      </View>
    </PressableScale>
  );
});

PersonCard.displayName = "PersonCard";

const styles = StyleSheet.create((theme) => ({
  card: {
    paddingVertical: 12,
    borderColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.personNeutralBg,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.personNeutralText,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    marginTop: 2,
    minWidth: 0,
  },
  directionSegment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  directionIcon: {
    flexShrink: 0,
  },
  separator: {
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 18,
    flexShrink: 0,
  },
  sub: {
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 18,
    flexShrink: 1,
  },
  amount: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.muted,
    lineHeight: 18,
    fontVariant: ["tabular-nums"],
    flexShrink: 1,
  },
}));
