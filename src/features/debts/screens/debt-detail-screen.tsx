import { useCallback, useRef, useState } from "react";

import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, Stack, router } from "expo-router";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Check, Copy, MoreHorizontal } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { type DebtAction, DebtActionsMenu } from "@/features/debts/components/debt-actions-menu";
import {
  RecordPaymentSheet,
  type RecordPaymentSheetRef,
} from "@/features/debts/components/record-payment-sheet";
import { debtKeys } from "@/features/debts/hooks/query-keys";
import { useArchiveDebt } from "@/features/debts/hooks/use-archive-debt";
import { useDebt } from "@/features/debts/hooks/use-debt";
import { confirmArchiveDebt } from "@/features/debts/lib/archive-confirmation";
import { DEBT_STATUS_LABELS } from "@/features/debts/lib/status-engine";
import type { CardDebtStatus, DebtDetailView } from "@/features/debts/view-models";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { lightImpact } from "@/lib/haptics";
import { LOADING_DETAIL_HEADER_OPTIONS } from "@/lib/navigation/stack-options";
import { formatCurrency, getFirstName } from "@/lib/utils/formatters";

type DebtDetailScreenProps = {
  debtId: string;
};

export function DebtDetailScreen({ debtId }: DebtDetailScreenProps) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const archiveDebt = useArchiveDebt();
  const { data: debt, isPending } = useDebt(debtId);
  const [copied, setCopied] = useState(false);
  const paymentSheetRef = useRef<RecordPaymentSheetRef>(null);

  const handleRefresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: debtKeys.detail(debtId) }),
    [debtId, queryClient],
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

  if (!debt) {
    return (
      <>
        <Stack.Screen options={{ title: "Debt not found" }} />
        <View style={styles.missing}>
          <Text style={styles.missingText}>This debt could not be found.</Text>
        </View>
      </>
    );
  }

  const pct = debt.amount > 0 ? ((debt.amount - debt.remaining) / debt.amount) * 100 : 0;
  const firstName = getFirstName(debt.name);
  const isUserOwed = debt.direction === "they_owe_me";
  const DirectionIcon = isUserOwed ? ArrowDownLeft : ArrowUpRight;
  const directionColor = isUserOwed ? theme.colors.success : theme.colors.danger;
  const reminderText = isUserOwed
    ? `Hey ${firstName}, just a reminder about the ${formatCurrency(debt.remaining)} you said you'd send on ${debt.dueDate}.`
    : debt.reason
      ? `You owe ${firstName} ${formatCurrency(debt.remaining)} for ${debt.reason}.`
      : `You owe ${firstName} ${formatCurrency(debt.remaining)}.`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(reminderText);
    lightImpact();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openRecordPayment = () => {
    paymentSheetRef.current?.present();
  };

  const handleDebtAction = (action: DebtAction) => {
    if (action === "record-payment") {
      openRecordPayment();
      return;
    }

    if (action === "edit-debt") {
      router.push(`/edit-debt?debtId=${debt.id}` as Href);
      return;
    }

    confirmArchiveDebt(debt, () => {
      archiveDebt.mutate(
        { debtId: debt.id },
        {
          onSuccess: () => {
            if (router.canGoBack()) {
              router.back();
            }
          },
        },
      );
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerTitleRow}>
              <Text numberOfLines={1} style={styles.headerTitleText}>
                {debt.name}
              </Text>
              <DirectionIcon
                color={directionColor}
                size={14}
                strokeWidth={2.3}
                style={styles.headerDirectionIcon}
              />
            </View>
          ),
          headerRight: () => (
            <DebtActionsMenu debt={debt} onAction={handleDebtAction}>
              <Pressable hitSlop={10} style={styles.headerMenuTrigger}>
                <MoreHorizontal color={theme.colors.icon} size={17} strokeWidth={2} />
              </Pressable>
            </DebtActionsMenu>
          ),
        }}
      />
      <BottomSheetModalProvider>
        <View collapsable={false} style={styles.screen}>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: debt.status === "paid" ? 24 : 120 + insets.bottom },
            ]}
            refreshControl={<RefreshControl {...refreshControlProps} />}
            showsVerticalScrollIndicator={false}
          >
            {debt.status === "paid" ? (
              <PaidOverview debt={debt} firstName={firstName} />
            ) : (
              <ActiveOverview debt={debt} pct={pct} />
            )}

            {debt.reason ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Reason</Text>
                <Text style={styles.sectionBody}>{debt.reason}</Text>
              </View>
            ) : null}

            {debt.payments.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Payment history ({debt.payments.length})</Text>
                {debt.payments.map((payment, index) => (
                  <View
                    key={payment.id}
                    style={[styles.paymentRow, index > 0 && styles.paymentRowBorder]}
                  >
                    <View style={styles.paymentMain}>
                      <Text style={styles.paymentAmount}>
                        {isUserOwed
                          ? `${formatCurrency(payment.amount)} paid`
                          : `You paid ${formatCurrency(payment.amount)}`}
                      </Text>
                      <Text style={styles.paymentDate}>{payment.date}</Text>
                    </View>
                    {payment.note ? <Text style={styles.paymentNote}>{payment.note}</Text> : null}
                  </View>
                ))}
              </View>
            ) : null}

            {debt.status !== "paid" ? (
              <View style={styles.lastSection}>
                <Text style={styles.sectionLabel}>
                  {isUserOwed ? "Follow-up message" : "Payment reminder"}
                </Text>
                {isUserOwed ? (
                  <Pressable
                    onPress={handleCopy}
                    style={[styles.messageBlock, styles.messageBlockCopyable]}
                  >
                    <View style={styles.copyIcon}>
                      {copied ? (
                        <Check color={theme.colors.success} size={14} strokeWidth={2.5} />
                      ) : (
                        <Copy color={theme.colors.mutedLight} size={14} strokeWidth={2.5} />
                      )}
                    </View>
                    <Text style={styles.messageText}>{reminderText}</Text>
                  </Pressable>
                ) : (
                  <View style={styles.messageBlock}>
                    <Text style={styles.messageText}>{reminderText}</Text>
                  </View>
                )}
              </View>
            ) : null}
          </ScrollView>

          {debt.status !== "paid" ? (
            <LinearGradient
              colors={theme.colors.footerGradient}
              style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}
            >
              <PressableScale onPress={openRecordPayment} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Add Payment</Text>
              </PressableScale>
            </LinearGradient>
          ) : null}
        </View>
        <RecordPaymentSheet ref={paymentSheetRef} debt={debt} />
      </BottomSheetModalProvider>
    </>
  );
}

function StatusPill({ status }: { status: CardDebtStatus }) {
  const { theme } = useUnistyles();
  const colors = theme.colors.status[status];

  return (
    <View style={[styles.statusPill, { backgroundColor: colors.bg }]}>
      <Text style={[styles.statusPillText, { color: colors.text }]}>
        {DEBT_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

function ActiveOverview({ debt, pct }: { debt: DebtDetailView; pct: number }) {
  return (
    <View style={styles.statsStrip}>
      <View style={styles.overviewHeader}>
        <Text style={styles.overviewDueDate}>Due {debt.dueDate}</Text>
        {debt.status !== "active" ? <StatusPill status={debt.status} /> : null}
      </View>
      <Text style={styles.overviewAmount}>{formatCurrency(debt.remaining)}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.overviewMeta}>
        {formatCurrency(debt.amount)} original{pct > 0 ? ` · ${Math.round(pct)}% paid` : null}
      </Text>
    </View>
  );
}

function PaidOverview({ debt, firstName }: { debt: DebtDetailView; firstName: string }) {
  const { theme } = useUnistyles();
  const lastPayment = debt.payments[debt.payments.length - 1];

  return (
    <View style={styles.statsStrip}>
      <View style={styles.paidRow}>
        <Check color={theme.colors.success} size={16} strokeWidth={2.5} />
        <Text style={styles.paidLabel}>Settled</Text>
        <StatusPill status={debt.status} />
      </View>
      <Text style={styles.overviewAmount}>{formatCurrency(debt.amount)}</Text>
      <Text style={styles.overviewMeta}>
        {debt.direction === "i_owe_them"
          ? `You fully paid this amount to ${firstName}.`
          : `${firstName} has fully paid this amount.`}
        {lastPayment ? ` Paid ${lastPayment.date}.` : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  headerMenuTrigger: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "100%",
  },
  headerTitleText: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.text,
  },
  headerDirectionIcon: {
    flexShrink: 0,
  },
  statsStrip: {
    gap: 6,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.name === "light" ? theme.colors.card : theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.name === "light" ? theme.colors.borderStrong : theme.colors.border,
  },
  overviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  overviewAmount: {
    fontSize: 28,
    fontWeight: "600",
    color: theme.colors.text,
    lineHeight: 32,
    fontVariant: ["tabular-nums"],
  },
  overviewDueDate: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.muted,
    lineHeight: 20,
  },
  overviewMeta: {
    fontSize: 14,
    color: theme.colors.muted,
    lineHeight: 20,
    marginTop: 8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: theme.colors.progressTrack,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.progressFill,
    borderRadius: 999,
  },
  paidRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 20,
  },
  paidLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.success,
  },
  statusPill: {
    flexShrink: 0,
    alignSelf: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 12,
  },
  section: {
    paddingBottom: 0,
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
  sectionBody: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
  },
  paymentRow: {
    paddingVertical: 12,
  },
  paymentRowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  paymentMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
  },
  paymentAmount: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
  },
  paymentDate: {
    fontSize: 13,
    color: theme.colors.mutedLight,
  },
  paymentNote: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
  },
  messageBlock: {
    backgroundColor: theme.name === "light" ? theme.colors.card : theme.colors.surfaceMuted,
    borderRadius: 12,
    padding: 14,
    position: "relative",
    ...(theme.name === "light"
      ? {
          borderWidth: 1,
          borderColor: theme.colors.borderStrong,
        }
      : null),
  },
  messageBlockCopyable: {
    paddingRight: 36,
  },
  copyIcon: {
    position: "absolute",
    top: 14,
    right: 14,
  },
  messageText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 22,
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
