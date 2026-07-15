import { Text, View } from "react-native";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

import {
  LIST_LEADING_INSET_AVATAR_MD,
  ListRowContainer,
} from "@/components/shared/list-inset-divider";
import { PressableScale } from "@/components/shared/pressable-scale";
import { HomeSection, HomeSurface } from "@/features/dashboard/components/home-section";
import type { HomePersonInsight } from "@/features/debts/lib/debt-list-utils";
import { formatCurrency } from "@/lib/utils/formatters";

const ROW_HORIZONTAL_PADDING = 16;

type HomePeopleSectionProps = {
  onPersonPress: (personId: string) => void;
  onSeeAll: () => void;
  people: HomePersonInsight[];
};

function personSubtitle(person: HomePersonInsight): string {
  const open = `${person.openDebtCount} open ${
    person.openDebtCount === 1 ? "promise" : "promises"
  }`;

  if (person.overdueCount > 0) {
    return `${open} · ${person.overdueCount} overdue`;
  }

  if (person.dueSoonCount >= 2) {
    return `${open} · ${person.dueSoonCount} due soon`;
  }

  return `${open} · Quiet for ${person.inactiveDays} days`;
}

export function HomePeopleSection({ onPersonPress, onSeeAll, people }: HomePeopleSectionProps) {
  return (
    <HomeSection actionLabel="See all" onActionPress={onSeeAll} title="People to follow up with">
      <HomeSurface>
        {people.map((person, index) => (
          <ListRowContainer
            key={person.id}
            leadingInset={LIST_LEADING_INSET_AVATAR_MD + ROW_HORIZONTAL_PADDING}
            showDivider={index > 0}
            trailingInset={ROW_HORIZONTAL_PADDING}
          >
            <PersonInsightRow person={person} onPress={() => onPersonPress(person.id)} />
          </ListRowContainer>
        ))}
      </HomeSurface>
    </HomeSection>
  );
}

function PersonInsightRow({ person, onPress }: { person: HomePersonInsight; onPress: () => void }) {
  const { theme } = useUnistyles();
  const statusColors =
    person.overdueCount > 0
      ? theme.colors.personStatus.overdue
      : person.dueSoonCount > 0
        ? theme.colors.personStatus["due-soon"]
        : null;

  return (
    <PressableScale onPress={onPress} style={styles.row}>
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: statusColors?.bg ?? theme.colors.personNeutralBg,
          },
        ]}
      >
        <Text
          style={[styles.initials, { color: statusColors?.text ?? theme.colors.personNeutralText }]}
        >
          {person.initials}
        </Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>
          {person.name}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {personSubtitle(person)}
        </Text>
      </View>
      <View style={styles.amountWrap}>
        <Text adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={styles.amount}>
          {formatCurrency(person.amount, person.currency)}
        </Text>
        <Text style={styles.amountLabel}>owed to you</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: ROW_HORIZONTAL_PADDING,
    paddingVertical: 13,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  initials: {
    fontSize: 14,
    fontWeight: "700",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: theme.colors.text,
  },
  meta: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.muted,
  },
  amountWrap: {
    alignItems: "flex-end",
    flexShrink: 0,
    maxWidth: "38%",
  },
  amount: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
  },
  amountLabel: {
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.muted,
  },
}));
