import { Text, View } from "react-native";

import { StyleSheet } from "react-native-unistyles";

import { DebtCard } from "@/components/debts/debt-card";
import {
  LIST_LEADING_INSET_AVATAR_MD,
  ListRowContainer,
} from "@/components/shared/list-inset-divider";
import { PressableScale } from "@/components/shared/pressable-scale";
import type { DebtAction } from "@/features/debts/components/debt-actions-menu";
import type { DebtFilterKey } from "@/features/debts/lib/debt-list-utils";
import type { DebtCardView } from "@/features/debts/view-models";

export const HOME_SECTION_DEBT_LIMIT = 5;

type HomeDebtSectionProps = {
  debts: DebtCardView[];
  filter: DebtFilterKey;
  onDebtPress: (debtId: string) => void;
  onDebtAction?: (action: DebtAction, debt: DebtCardView) => void;
  onTitlePress: (filter: DebtFilterKey) => void;
  showDirectionCue?: boolean;
  title: string;
  titleColor?: string;
};

export function HomeDebtSection({
  title,
  titleColor,
  debts,
  filter,
  onDebtPress,
  onDebtAction,
  onTitlePress,
  showDirectionCue = false,
}: HomeDebtSectionProps) {
  const preview = debts.slice(0, HOME_SECTION_DEBT_LIMIT);

  return (
    <View style={styles.section}>
      <PressableScale hitSlop={8} onPress={() => onTitlePress(filter)}>
        <Text style={[styles.sectionTitle, titleColor ? { color: titleColor } : null]}>
          {title}
        </Text>
      </PressableScale>
      <View style={styles.cards}>
        {preview.map((debt, index) => {
          const needsBreathingRoom = debt.status === "due-soon" || debt.status === "overdue";

          return (
            <ListRowContainer
              key={debt.id}
              leadingInset={LIST_LEADING_INSET_AVATAR_MD}
              showDivider={index > 0}
            >
              <DebtCard
                debt={debt}
                onAction={onDebtAction}
                onPress={() => onDebtPress(debt.id)}
                showDirectionCue={showDirectionCue}
                showStatusCue={false}
                style={needsBreathingRoom ? styles.statusDebtCard : null}
              />
            </ListRowContainer>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    marginTop: 4,
  },
  cards: {
    gap: 0,
  },
  statusDebtCard: {
    paddingVertical: 12,
  },
}));
