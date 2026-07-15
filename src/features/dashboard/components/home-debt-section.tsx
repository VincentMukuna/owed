import { StyleSheet } from "react-native-unistyles";

import { DebtCard } from "@/components/debts/debt-card";
import {
  LIST_LEADING_INSET_AVATAR_MD,
  ListRowContainer,
} from "@/components/shared/list-inset-divider";
import { HomeSection, HomeSurface } from "@/features/dashboard/components/home-section";
import type { DebtAction } from "@/features/debts/components/debt-actions-menu";
import { formatDebtAttentionMeta } from "@/features/debts/lib/debt-card-meta";
import type { DebtCardView } from "@/features/debts/view-models";

const LEDGER_HORIZONTAL_PADDING = 16;

type HomeDebtSectionProps = {
  debts: DebtCardView[];
  onDebtPress: (debtId: string) => void;
  onDebtAction?: (action: DebtAction, debt: DebtCardView) => void;
  onSeeAll: () => void;
  showDirectionCue?: boolean;
};

export function HomeDebtSection({
  debts,
  onDebtPress,
  onDebtAction,
  onSeeAll,
  showDirectionCue = false,
}: HomeDebtSectionProps) {
  const now = new Date();

  return (
    <HomeSection actionLabel="See all" onActionPress={onSeeAll} title="Needs attention">
      <HomeSurface>
        {debts.map((debt, index) => {
          const needsBreathingRoom = debt.status === "due-soon" || debt.status === "overdue";
          const attentionMeta = formatDebtAttentionMeta(debt.dueDateISO, now);

          return (
            <ListRowContainer
              key={debt.id}
              leadingInset={LIST_LEADING_INSET_AVATAR_MD + LEDGER_HORIZONTAL_PADDING}
              showDivider={index > 0}
              trailingInset={LEDGER_HORIZONTAL_PADDING}
            >
              <DebtCard
                debt={debt}
                onAction={onDebtAction}
                onPress={() => onDebtPress(debt.id)}
                showDirectionCue={showDirectionCue}
                supportingText={attentionMeta.label}
                supportingTextTone={attentionMeta.tone}
                style={[styles.ledgerRow, needsBreathingRoom ? styles.statusDebtCard : null]}
              />
            </ListRowContainer>
          );
        })}
      </HomeSurface>
    </HomeSection>
  );
}

const styles = StyleSheet.create(() => ({
  ledgerRow: {
    paddingHorizontal: LEDGER_HORIZONTAL_PADDING,
  },
  statusDebtCard: {
    paddingVertical: 12,
  },
}));
