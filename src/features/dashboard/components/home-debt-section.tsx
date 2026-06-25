import { StyleSheet, Text, View } from "react-native";

import { DebtCard } from "@/components/debts/debt-card";
import { PressableScale } from "@/components/shared/pressable-scale";
import type { DebtFilterKey } from "@/features/debts/lib/debt-list-utils";
import type { DebtCardView } from "@/features/debts/view-models";

export const HOME_SECTION_DEBT_LIMIT = 5;

type HomeDebtSectionProps = {
  debts: DebtCardView[];
  filter: DebtFilterKey;
  onDebtPress: (debtId: string) => void;
  onTitlePress: (filter: DebtFilterKey) => void;
  title: string;
  titleColor?: string;
};

export function HomeDebtSection({
  title,
  titleColor,
  debts,
  filter,
  onDebtPress,
  onTitlePress,
}: HomeDebtSectionProps) {
  const preview = debts.slice(0, HOME_SECTION_DEBT_LIMIT);

  return (
    <View style={styles.section}>
      <PressableScale hitSlop={8} onPress={() => onTitlePress(filter)}>
        <Text style={[styles.sectionTitle, titleColor ? { color: titleColor } : null]}>{title}</Text>
      </PressableScale>
      <View style={styles.cards}>
        {preview.map((debt) => (
          <DebtCard key={debt.id} debt={debt} onPress={() => onDebtPress(debt.id)} />
        ))}
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
    fontWeight: "600",
    color: "#8A8A82",
    textTransform: "uppercase",
    letterSpacing: 1.6,
    marginTop: 4,
  },
  cards: {
    gap: 10,
  },
});
