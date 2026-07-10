import { type ReactNode, useCallback, useRef, useState } from "react";

import { RefreshControl, ScrollView, Text, View } from "react-native";

import { type Href, Stack, router } from "expo-router";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Receipt, Wallet } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { ActivityRow } from "@/components/activity/activity-list";
import { DebtCard } from "@/components/debts/debt-card";
import { PressableScale } from "@/components/shared/pressable-scale";
import { DetailScreenSkeleton } from "@/components/ui/screen-skeletons";
import type { DebtAction } from "@/features/debts/components/debt-actions-menu";
import {
  RecordPaymentSheet,
  type RecordPaymentSheetRef,
} from "@/features/debts/components/record-payment-sheet";
import { peopleKeys } from "@/features/debts/hooks/query-keys";
import { useArchiveDebt } from "@/features/debts/hooks/use-archive-debt";
import { confirmArchiveDebt } from "@/features/debts/lib/archive-confirmation";
import type { DebtCardView } from "@/features/debts/view-models";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { formatCurrency, getFirstName } from "@/lib/utils/formatters";

import { PersonStatusBadge } from "../components/person-status-badge";
import { usePersonDetail } from "../hooks/use-person-detail";
import type { PersonDetailView } from "../view-models";

type PersonDetailScreenProps = {
  personId: string;
};

export function PersonDetailScreen({ personId }: PersonDetailScreenProps) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const archiveDebt = useArchiveDebt();
  const { data: person, isPending } = usePersonDetail(personId);
  const [debtsExpanded, setDebtsExpanded] = useState(true);
  const [paymentsExpanded, setPaymentsExpanded] = useState(true);
  const paymentSheetRef = useRef<RecordPaymentSheetRef>(null);
  const [paymentDebt, setPaymentDebt] = useState<DebtCardView | null>(null);

  const handleRefresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: peopleKeys.detail(personId) }),
    [personId, queryClient],
  );
  const { refreshControlProps } = useRefreshControl({ onRefresh: handleRefresh });

  if (isPending) {
    return <DetailScreenSkeleton />;
  }

  if (!person) {
    return (
      <>
        <Stack.Screen options={{ title: "Person not found" }} />
        <View style={styles.missing}>
          <Text style={styles.missingText}>This person could not be found.</Text>
        </View>
      </>
    );
  }

  const firstName = getFirstName(person.name);

  const openDebt = (debtId: string) => {
    router.push(`/debt/${debtId}`);
  };

  const openEdit = () => {
    router.push(`/edit-person?personId=${person.id}` as Href);
  };

  const openAddDebt = () => {
    router.push(
      `/add-debt?personId=${person.id}&personName=${encodeURIComponent(person.name)}` as Href,
    );
  };

  const handleDebtAction = (action: DebtAction, debt: DebtCardView) => {
    if (action === "record-payment") {
      setPaymentDebt(debt);
      requestAnimationFrame(() => paymentSheetRef.current?.present());
      return;
    }

    if (action === "edit-debt") {
      router.push(`/edit-debt?debtId=${debt.id}` as Href);
      return;
    }

    confirmArchiveDebt(debt, () => {
      archiveDebt.mutate({ debtId: debt.id });
    });
  };

  const hasDetails = Boolean(person.phoneNumber) || Boolean(person.notes);

  return (
    <>
      <Stack.Screen
        options={{
          title: person.name,
          headerRight: () => (
            <PressableScale hitSlop={8} onPress={openEdit}>
              <Text style={styles.headerAction}>Edit</Text>
            </PressableScale>
          ),
        }}
      />
      <BottomSheetModalProvider>
        <View collapsable={false} style={styles.screen}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
            refreshControl={<RefreshControl {...refreshControlProps} />}
            showsVerticalScrollIndicator={false}
          >
            <PersonSummary person={person} />

            {hasDetails ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Details</Text>
                {person.phoneNumber ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Phone</Text>
                    <Text style={styles.detailValue}>{person.phoneNumber}</Text>
                  </View>
                ) : null}
                {person.notes ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Notes</Text>
                    <Text style={[styles.detailValue, styles.detailNotes]}>{person.notes}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <CollapsibleSection
              count={person.debts.length}
              expanded={debtsExpanded}
              onToggle={() => setDebtsExpanded((value) => !value)}
              title="Promises"
            >
              {person.debts.length > 0 ? (
                <View style={styles.cards}>
                  {person.debts.map((debt) => (
                    <DebtCard
                      key={debt.id}
                      debt={debt}
                      onAction={handleDebtAction}
                      onPress={() => openDebt(debt.id)}
                      showDirectionCue
                    />
                  ))}
                </View>
              ) : (
                <SectionEmpty
                  copy={`Add the first promise between you and ${firstName}.`}
                  icon={<Wallet color={theme.colors.mutedLight} size={20} strokeWidth={1.5} />}
                  title="No promises yet"
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection
              count={person.payments.length}
              expanded={paymentsExpanded}
              onToggle={() => setPaymentsExpanded((value) => !value)}
              title="Payment history"
            >
              {person.payments.length > 0 ? (
                <View>
                  {person.payments.map((payment) => (
                    <ActivityRow key={payment.id} activity={payment} />
                  ))}
                </View>
              ) : (
                <SectionEmpty
                  copy={`Payments between you and ${firstName} will show up here.`}
                  icon={<Receipt color={theme.colors.mutedLight} size={20} strokeWidth={1.5} />}
                  title="No payments yet"
                />
              )}
            </CollapsibleSection>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <PressableScale onPress={openAddDebt} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Add promise for {firstName}</Text>
            </PressableScale>
          </View>
        </View>
        <RecordPaymentSheet ref={paymentSheetRef} debt={paymentDebt} />
      </BottomSheetModalProvider>
    </>
  );
}

function PersonSummary({ person }: { person: PersonDetailView }) {
  const promiseCount = person.openDebtCount;
  const supporting =
    person.status === "none"
      ? "No debts yet"
      : person.status === "settled"
        ? "All settled up"
        : `Across ${promiseCount} active ${promiseCount === 1 ? "promise" : "promises"}`;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <Text style={styles.summaryHint}>Total unsettled</Text>
        <PersonStatusBadge overdueCount={person.overdueCount} status={person.status} />
      </View>
      <Text style={styles.summaryAmount}>{formatCurrency(person.outstanding)}</Text>
      <Text style={styles.summarySupport}>{supporting}</Text>
      <View style={styles.directionBreakdown}>
        <View>
          <Text style={styles.summaryFooterLabel}>Owed to you</Text>
          <Text style={styles.summaryFooterValue}>{formatCurrency(person.owedToYou)}</Text>
        </View>
        <View>
          <Text style={styles.summaryFooterLabel}>You owe</Text>
          <Text style={styles.summaryFooterValue}>{formatCurrency(person.youOwe)}</Text>
        </View>
      </View>
    </View>
  );
}

function CollapsibleSection({
  title,
  count,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.section}>
      <PressableScale hitSlop={8} onPress={onToggle} style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>
          {title} ({count})
        </Text>
        {expanded ? (
          <ChevronUp color={theme.colors.muted} size={16} strokeWidth={2} />
        ) : (
          <ChevronDown color={theme.colors.muted} size={16} strokeWidth={2} />
        )}
      </PressableScale>
      {expanded ? children : null}
    </View>
  );
}

function SectionEmpty({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return (
    <View style={styles.sectionEmpty}>
      <View style={styles.sectionEmptyIcon}>{icon}</View>
      <Text style={styles.sectionEmptyTitle}>{title}</Text>
      <Text style={styles.sectionEmptyCopy}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerAction: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  missingText: {
    fontSize: 16,
    color: theme.colors.muted,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.name === "light" ? 0.025 : 0.05,
    shadowRadius: theme.name === "light" ? 1.5 : 2,
    elevation: theme.name === "light" ? 0 : 1,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryHint: {
    fontSize: 12,
    color: theme.colors.mutedLight,
    fontWeight: "500",
  },
  summaryAmount: {
    fontSize: 34,
    fontWeight: "700",
    color: theme.colors.text,
    lineHeight: 36,
    marginTop: 6,
    fontVariant: ["tabular-nums"],
  },
  summarySupport: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 4,
  },
  directionBreakdown: {
    flexDirection: "row",
    gap: 20,
    marginTop: 16,
  },
  summaryFooterLabel: {
    fontSize: 11,
    color: theme.colors.mutedLight,
    fontWeight: "500",
  },
  summaryFooterValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  card: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  detailRow: {
    marginTop: 14,
  },
  detailKey: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
  },
  detailNotes: {
    lineHeight: 20,
  },
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  cards: {
    gap: 10,
  },
  sectionEmpty: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  sectionEmptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  sectionEmptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.icon,
  },
  sectionEmptyCopy: {
    fontSize: 12,
    color: theme.colors.mutedLight,
    marginTop: 4,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: theme.colors.background,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: {
    color: theme.colors.primaryForeground,
    fontSize: 15,
    fontWeight: "600",
  },
}));
