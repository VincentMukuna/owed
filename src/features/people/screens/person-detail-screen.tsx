import { useCallback, useState } from "react";

import { RefreshControl, ScrollView, Text, View } from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { type Href, Stack, router } from "expo-router";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { type DebtAction, DebtActionsMenu } from "@/features/debts/components/debt-actions-menu";
import { peopleKeys } from "@/features/debts/hooks/query-keys";
import { useArchiveDebt } from "@/features/debts/hooks/use-archive-debt";
import { confirmArchiveDebt } from "@/features/debts/lib/archive-confirmation";
import { formatRelativeDay, toISODate } from "@/features/debts/lib/format-dates";
import { DEBT_STATUS_LABELS } from "@/features/debts/lib/status-engine";
import type { ActivityView, DebtCardView } from "@/features/debts/view-models";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { selectionChange } from "@/lib/haptics";
import { LOADING_DETAIL_HEADER_OPTIONS } from "@/lib/navigation/stack-options";
import { formatCurrency, getFirstName } from "@/lib/utils/formatters";
import type { DebtDirection } from "@/types";

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
  const [directionFilter, setDirectionFilter] = useState<DebtDirection | null>(null);

  const handleRefresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: peopleKeys.detail(personId) }),
    [personId, queryClient],
  );
  const { refreshControlProps } = useRefreshControl({ onRefresh: handleRefresh });

  if (isPending) {
    return (
      <>
        <Stack.Screen options={LOADING_DETAIL_HEADER_OPTIONS} />
        <LoadingSpinner />
      </>
    );
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
      router.push(`/record-payment?debtId=${debt.id}` as Href);
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
  const filteredDebts = directionFilter
    ? person.debts.filter((debt) => debt.direction === directionFilter)
    : person.debts;

  const handleDirectionPress = (direction: DebtDirection) => {
    selectionChange();
    setDirectionFilter((current) => (current === direction ? null : direction));
  };

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
      <View collapsable={false} style={styles.screen} testID="person-detail-ready">
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
          refreshControl={<RefreshControl {...refreshControlProps} />}
          showsVerticalScrollIndicator={false}
        >
          <PersonOverview
            onDirectionPress={handleDirectionPress}
            person={person}
            selectedDirection={directionFilter}
          />

          {hasDetails ? (
            <View style={styles.detailsSection}>
              {person.phoneNumber ? (
                <View>
                  <Text style={styles.detailKey}>Phone</Text>
                  <Text style={styles.detailValue}>{person.phoneNumber}</Text>
                </View>
              ) : null}
              {person.notes ? (
                <View>
                  <Text style={styles.detailKey}>Notes</Text>
                  <Text style={[styles.detailValue, styles.detailNotes]}>{person.notes}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Debts ({filteredDebts.length}
              {directionFilter && filteredDebts.length !== person.debts.length
                ? ` of ${person.debts.length}`
                : ""}
              )
            </Text>
            {filteredDebts.length > 0 ? (
              filteredDebts.map((debt, index) => (
                <PromiseRow
                  key={debt.id}
                  debt={debt}
                  onAction={handleDebtAction}
                  onPress={() => openDebt(debt.id)}
                  showBorder={index > 0}
                />
              ))
            ) : person.debts.length > 0 ? (
              <Text style={styles.emptyCopy}>
                {directionFilter === "they_owe_me"
                  ? `Nothing ${firstName} owes you right now.`
                  : `Nothing you owe ${firstName} right now.`}
              </Text>
            ) : (
              <Text style={styles.emptyCopy}>Add the first debt between you and {firstName}.</Text>
            )}
          </View>

          <View style={styles.lastSection}>
            <Text style={styles.sectionLabel}>Payment history ({person.payments.length})</Text>
            {person.payments.length > 0 ? (
              person.payments.map((payment, index) => (
                <PaymentRow key={payment.id} activity={payment} showBorder={index > 0} />
              ))
            ) : (
              <Text style={styles.emptyCopy}>
                Payments between you and {firstName} will show up here.
              </Text>
            )}
          </View>
        </ScrollView>

        <LinearGradient
          colors={theme.colors.footerGradient}
          style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}
        >
          <PressableScale onPress={openAddDebt} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Add debt for {firstName}</Text>
          </PressableScale>
        </LinearGradient>
      </View>
    </>
  );
}

function formatAcrossCaption(count: number): string {
  const label = count >= 10 ? "9+" : String(count);
  return `across ${label} ${count === 1 ? "debt" : "debts"}`;
}

function StatColumn({
  label,
  amount,
  count,
  selected,
  onPress,
}: {
  label: string;
  amount: string;
  count: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.statColumn, selected && styles.statColumnSelected]}
    >
      <Text style={styles.balanceLabel}>{label}</Text>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        numberOfLines={1}
        style={styles.balanceAmount}
      >
        {amount}
      </Text>
      <Text style={styles.balanceCaption}>{formatAcrossCaption(count)}</Text>
    </PressableScale>
  );
}

function PersonOverview({
  person,
  selectedDirection,
  onDirectionPress,
}: {
  person: PersonDetailView;
  selectedDirection: DebtDirection | null;
  onDirectionPress: (direction: DebtDirection) => void;
}) {
  return (
    <View style={styles.statsStrip}>
      <StatColumn
        amount={formatCurrency(person.owedToYou)}
        count={person.owedToYouOpenCount}
        label="They owe"
        onPress={() => onDirectionPress("they_owe_me")}
        selected={selectedDirection === "they_owe_me"}
      />
      <View style={styles.statsDivider} />
      <StatColumn
        amount={formatCurrency(person.youOwe)}
        count={person.youOweOpenCount}
        label="You owe"
        onPress={() => onDirectionPress("i_owe_them")}
        selected={selectedDirection === "i_owe_them"}
      />
    </View>
  );
}

function OverdueBadge() {
  const { theme } = useUnistyles();
  const colors = theme.colors.status.overdue;

  return (
    <View style={[styles.overdueBadge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.overdueBadgeText, { color: colors.text }]}>
        {DEBT_STATUS_LABELS.overdue}
      </Text>
    </View>
  );
}

function PromiseRow({
  debt,
  onPress,
  onAction,
  showBorder,
}: {
  debt: DebtCardView;
  onPress: () => void;
  onAction: (action: DebtAction, debt: DebtCardView) => void;
  showBorder: boolean;
}) {
  const { theme } = useUnistyles();
  const isUserOwed = debt.direction === "they_owe_me";
  const DirectionIcon = isUserOwed ? ArrowDownLeft : ArrowUpRight;
  const directionColor = isUserOwed ? theme.colors.success : theme.colors.danger;
  const isPaid = debt.status === "paid";
  const amount = formatCurrency(isPaid ? debt.amount : debt.remaining, debt.currency);
  const dueLabel = isPaid ? formatPaidWhen(debt.lastPaymentAt) : debt.dueDate;

  const row = (
    <PressableScale onPress={onPress} style={[styles.promiseRow, showBorder && styles.rowBorder]}>
      <View style={styles.promiseMain}>
        <View style={styles.promiseLeft}>
          <View style={styles.promiseTitleRow}>
            <DirectionIcon color={directionColor} size={14} strokeWidth={2.3} />
            <Text numberOfLines={1} style={styles.promiseReason}>
              {debt.reason || "No reason"}
            </Text>
            {isPromiseOverdue(debt) ? <OverdueBadge /> : null}
          </View>
          <Text style={styles.promiseDue}>{dueLabel}</Text>
        </View>
        <Text style={styles.promiseAmount}>{amount}</Text>
      </View>
    </PressableScale>
  );

  return (
    <DebtActionsMenu debt={debt} onAction={onAction} openOnLongPress>
      {row}
    </DebtActionsMenu>
  );
}

function PaymentRow({ activity, showBorder }: { activity: ActivityView; showBorder: boolean }) {
  return (
    <View style={[styles.paymentRow, showBorder && styles.rowBorder]}>
      <View style={styles.paymentMain}>
        <Text style={styles.paymentText}>{activity.text}</Text>
        <Text style={styles.paymentTime}>{activity.time}</Text>
      </View>
      {activity.sub ? <Text style={styles.paymentSub}>{activity.sub}</Text> : null}
    </View>
  );
}

function isPromiseOverdue(debt: DebtCardView): boolean {
  if (debt.status === "paid" || debt.remaining <= 0) {
    return false;
  }

  return debt.dueDateISO < toISODate(new Date());
}

function formatPaidWhen(lastPaymentAt?: string): string {
  if (!lastPaymentAt) {
    return "Paid";
  }

  const when = formatRelativeDay(lastPaymentAt);
  if (when === "Today") {
    return "Paid today";
  }
  if (when === "Yesterday") {
    return "Paid yesterday";
  }

  return `Paid ${when}`;
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
    paddingTop: 16,
    gap: 28,
  },
  statsStrip: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.name === "light" ? theme.colors.card : theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.name === "light" ? theme.colors.borderStrong : theme.colors.border,
  },
  statColumn: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  statColumnSelected: {
    backgroundColor: theme.name === "light" ? theme.colors.surface : theme.colors.card,
    borderWidth: 1,
    borderColor: theme.name === "light" ? theme.colors.borderStrong : theme.colors.border,
  },
  statsDivider: {
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: 12,
    backgroundColor: theme.name === "light" ? theme.colors.listDivider : theme.colors.border,
    opacity: theme.name === "light" ? 1 : 0.6,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.mutedLight,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 32,
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
  },
  balanceCaption: {
    fontSize: 11,
    color: theme.colors.mutedLight,
    lineHeight: 14,
    marginTop: 4,
  },
  section: {
    paddingBottom: 24,
  },
  lastSection: {
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.mutedLight,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  detailsSection: {
    gap: 8,
  },
  detailKey: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.mutedLight,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  detailValue: {
    fontSize: 15,
    color: theme.colors.text,
    marginTop: 4,
    lineHeight: 22,
  },
  detailNotes: {
    lineHeight: 22,
  },
  promiseRow: {
    paddingVertical: 12,
  },
  promiseMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  promiseLeft: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  promiseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
    minHeight: 20,
  },
  promiseReason: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    lineHeight: 20,
  },
  overdueBadge: {
    flexShrink: 0,
    alignSelf: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
  overdueBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 12,
  },
  promiseDue: {
    fontSize: 13,
    color: theme.colors.mutedLight,
    marginLeft: 20,
  },
  promiseAmount: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
  },
  paymentRow: {
    paddingVertical: 12,
  },
  paymentMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
  },
  paymentText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  paymentTime: {
    fontSize: 13,
    color: theme.colors.mutedLight,
  },
  paymentSub: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  emptyCopy: {
    fontSize: 14,
    color: theme.colors.muted,
    lineHeight: 20,
    paddingTop: 4,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
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
