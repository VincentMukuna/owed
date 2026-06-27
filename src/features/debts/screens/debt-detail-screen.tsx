import { useCallback, useState } from "react";

import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router } from "expo-router";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { Badge } from "@/components/ui/badge";
import { DetailScreenSkeleton } from "@/components/ui/screen-skeletons";
import { debtKeys } from "@/features/debts/hooks/query-keys";
import { useDebt } from "@/features/debts/hooks/use-debt";
import type { DebtDetailView } from "@/features/debts/view-models";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { formatCurrency, getFirstName } from "@/lib/utils/formatters";

type DebtDetailScreenProps = {
  debtId: string;
};

export function DebtDetailScreen({ debtId }: DebtDetailScreenProps) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: debt, isPending } = useDebt(debtId);
  const [copied, setCopied] = useState(false);

  const handleRefresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: debtKeys.detail(debtId) }),
    [debtId, queryClient],
  );
  const { refreshControlProps } = useRefreshControl({ onRefresh: handleRefresh });

  if (isPending) {
    return <DetailScreenSkeleton />;
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
  const followUpMsg = `Hey ${firstName}, just a reminder about the ${formatCurrency(debt.remaining)} you said you'd send on ${debt.dueDate}.`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(followUpMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openRecordPayment = () => {
    router.push(`/record-payment?debtId=${debt.id}`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => <Badge status={debt.status} />,
          title: debt.name,
        }}
      />
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
            <PaidSummary debt={debt} firstName={firstName} />
          ) : (
            <ActiveSummary debt={debt} pct={pct} />
          )}

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Reason</Text>
            <Text style={styles.cardBody}>{debt.reason}</Text>
          </View>

          {debt.payments.length > 0 ? (
            <View style={styles.card}>
              <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>Payment history</Text>
              {debt.payments.map((payment, index) => (
                <View key={payment.id} style={styles.timelineRow}>
                  <View style={styles.timelineRail}>
                    <View style={styles.timelineDot} />
                    {index < debt.payments.length - 1 ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={styles.timelineBody}>
                    <View style={styles.timelineTop}>
                      <Text style={styles.paymentAmount}>
                        {formatCurrency(payment.amount)} paid
                      </Text>
                      <Text style={styles.paymentDate}>{payment.date}</Text>
                    </View>
                    {payment.note ? <Text style={styles.paymentNote}>{payment.note}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {debt.status !== "paid" ? (
            <View style={styles.followUpSection}>
              <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>Follow-up message</Text>
              <View style={styles.messageCard}>
                <Text style={styles.messageBox}>{followUpMsg}</Text>
                <Pressable onPress={handleCopy} style={styles.copyBtn}>
                  {copied ? (
                    <Check color={theme.colors.success} size={14} strokeWidth={2.5} />
                  ) : (
                    <Copy color={theme.colors.primary} size={14} strokeWidth={2.5} />
                  )}
                  <Text style={[styles.copyText, copied && styles.copyTextSuccess]}>
                    {copied ? "Copied!" : "Copy message"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {debt.status !== "paid" ? (
          <LinearGradient
            colors={theme.colors.footerGradient}
            style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}
          >
            <PressableScale onPress={openRecordPayment} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Add payment</Text>
            </PressableScale>
          </LinearGradient>
        ) : null}
      </View>
    </>
  );
}

function ActiveSummary({ debt, pct }: { debt: DebtDetailView; pct: number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryHint}>Amount remaining</Text>
      <Text style={styles.summaryAmount}>{formatCurrency(debt.remaining)}</Text>
      <View style={styles.partialBlock}>
        <View style={styles.partialMeta}>
          <Text style={styles.partialMetaText}>Original: {formatCurrency(debt.amount)}</Text>
          <Text style={styles.partialMetaText}>{Math.round(pct)}% paid</Text>
        </View>
        <View style={styles.progressTrackLg}>
          <View style={[styles.progressFillLg, { width: `${pct}%` }]} />
        </View>
      </View>
      <View style={styles.summaryFooter}>
        <View>
          <Text style={styles.summaryFooterLabel}>Due</Text>
          <Text style={styles.summaryFooterValue}>{debt.dueDate}</Text>
        </View>
        <View>
          <Text style={styles.summaryFooterLabel}>Added</Text>
          <Text style={styles.summaryFooterValue}>{debt.addedDate}</Text>
        </View>
      </View>
    </View>
  );
}

function PaidSummary({ debt, firstName }: { debt: DebtDetailView; firstName: string }) {
  const { theme } = useUnistyles();
  const lastPayment = debt.payments[debt.payments.length - 1];

  return (
    <View style={styles.paidCard}>
      <View style={styles.paidIcon}>
        <Check color={theme.colors.success} size={24} strokeWidth={2.5} />
      </View>
      <Text style={styles.paidTitle}>Settled</Text>
      <Text style={styles.paidCopy}>{firstName} has fully paid this amount.</Text>
      <Text style={styles.paidAmount}>{formatCurrency(debt.amount)}</Text>
      {lastPayment ? <Text style={styles.paidDate}>Paid {lastPayment.date}</Text> : null}
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
    paddingTop: 8,
    gap: 24,
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
  summaryHint: {
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  summaryAmount: {
    fontSize: 40,
    fontWeight: "600",
    color: theme.colors.text,
    lineHeight: 44,
    marginTop: 8,
    fontVariant: ["tabular-nums"],
  },
  partialBlock: {
    marginTop: 16,
  },
  partialMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  partialMetaText: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  progressTrackLg: {
    height: 6,
    backgroundColor: theme.colors.progressTrack,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFillLg: {
    height: "100%",
    backgroundColor: theme.colors.progressFill,
    borderRadius: 999,
  },
  summaryFooter: {
    flexDirection: "row",
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  summaryFooterLabel: {
    fontSize: 11,
    color: theme.colors.mutedLight,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summaryFooterValue: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
    marginTop: 4,
  },
  paidCard: {
    backgroundColor: theme.colors.paidSurface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.paidBorder,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.name === "light" ? 0.025 : 0.05,
    shadowRadius: theme.name === "light" ? 1.5 : 2,
    elevation: theme.name === "light" ? 0 : 1,
  },
  paidIcon: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: theme.colors.paidIcon,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  paidTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.paidTitle,
  },
  paidCopy: {
    fontSize: 14,
    color: theme.colors.paidText,
    marginTop: 4,
  },
  paidAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.paidAmount,
    marginTop: 12,
    fontVariant: ["tabular-nums"],
  },
  paidDate: {
    fontSize: 12,
    color: theme.colors.paidMuted,
    marginTop: 4,
  },
  card: {
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.mutedLight,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  cardLabelSpaced: {
    marginBottom: 16,
  },
  cardBody: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 22,
    marginTop: 10,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
  },
  timelineRail: {
    width: 20,
    alignItems: "center",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.success,
    marginTop: 4,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: theme.colors.surface,
    marginVertical: 4,
  },
  timelineBody: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
  },
  paymentDate: {
    fontSize: 12,
    color: theme.colors.mutedLight,
  },
  paymentNote: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  followUpSection: {
    paddingBottom: 4,
  },
  messageCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 14,
  },
  messageBox: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 23,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  copyText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  copyTextSuccess: {
    color: theme.colors.success,
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
