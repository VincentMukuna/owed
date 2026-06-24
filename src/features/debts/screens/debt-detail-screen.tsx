import { useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { ArrowLeft, Check, Copy, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/components/shared/bottom-sheet";
import { IconButton } from "@/components/shared/icon-button";
import { PressableScale } from "@/components/shared/pressable-scale";
import { ScreenContainer } from "@/components/shared/screen-container";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/features/debts/store/app-store";
import type { Debt } from "@/features/debts/types";
import { formatCurrency, getFirstName } from "@/lib/utils/formatters";

type DebtDetailScreenProps = {
  debtId: number;
};

export function DebtDetailScreen({ debtId }: DebtDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const debt = useAppStore((s) => s.getDebt(debtId));
  const addPayment = useAppStore((s) => s.addPayment);

  const [copied, setCopied] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  if (!debt) {
    return (
      <ScreenContainer style={{ paddingTop: insets.top, padding: 20 }}>
        <IconButton onPress={() => router.back()}>
          <ArrowLeft color="#4A4A42" size={16} strokeWidth={2} />
        </IconButton>
        <Text style={styles.title}>Debt not found</Text>
      </ScreenContainer>
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

  const handleSavePayment = () => {
    const amount = parseInt(payAmount, 10);
    if (!amount) return;
    addPayment(debt.id, amount, payNote);
    setShowPayment(false);
    setPayAmount("");
    setPayNote("");
  };

  return (
    <ScreenContainer padded={false} style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <IconButton onPress={() => router.back()}>
          <ArrowLeft color="#4A4A42" size={16} strokeWidth={2} />
        </IconButton>
        <View style={styles.headerMain}>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {debt.name}
          </Text>
          <Badge status={debt.status} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: debt.status === "paid" ? 40 : 120 + insets.bottom },
        ]}
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
                    <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)} paid</Text>
                    <Text style={styles.paymentDate}>{payment.date}</Text>
                  </View>
                  {payment.note ? <Text style={styles.paymentNote}>{payment.note}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {debt.status !== "paid" ? (
          <View style={styles.card}>
            <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>Follow-up message</Text>
            <Text style={styles.messageBox}>{followUpMsg}</Text>
            <Pressable onPress={handleCopy} style={styles.copyBtn}>
              {copied ? (
                <Check color="#16A34A" size={14} strokeWidth={2.5} />
              ) : (
                <Copy color="#1A3A2A" size={14} strokeWidth={2.5} />
              )}
              <Text style={[styles.copyText, copied && styles.copyTextSuccess]}>
                {copied ? "Copied!" : "Copy message"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {debt.status !== "paid" ? (
        <LinearGradient
          colors={["rgba(247,245,241,0)", "rgba(247,245,241,0.95)", "#F7F5F1"]}
          style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}
        >
          <PressableScale onPress={() => setShowPayment(true)} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Add payment</Text>
          </PressableScale>
        </LinearGradient>
      ) : null}

      <BottomSheet onClose={() => setShowPayment(false)} visible={showPayment}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Add payment</Text>
          <Pressable onPress={() => setShowPayment(false)} hitSlop={8}>
            <X color="#8A8A82" size={16} />
          </Pressable>
        </View>

        <View style={styles.sheetField}>
          <Text style={styles.label}>Amount paid</Text>
          <View>
            <Text style={styles.prefix}>KES</Text>
            <TextInput
              autoFocus
              keyboardType="number-pad"
              onChangeText={setPayAmount}
              placeholder="0"
              placeholderTextColor="#DDDDD8"
              style={[styles.sheetInput, styles.amountInput]}
              value={payAmount}
            />
          </View>
          <Pressable onPress={() => setPayAmount(String(debt.remaining))}>
            <Text style={styles.fullAmountLink}>
              Mark full remaining ({formatCurrency(debt.remaining)})
            </Text>
          </Pressable>
        </View>

        <View style={styles.sheetField}>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            onChangeText={setPayNote}
            placeholder="e.g. M-Pesa, cash, bank transfer"
            placeholderTextColor="#C8C8C0"
            style={styles.sheetInput}
            value={payNote}
          />
        </View>

        <PressableScale
          disabled={!payAmount || parseInt(payAmount, 10) <= 0}
          onPress={handleSavePayment}
          style={[
            styles.primaryBtn,
            (!payAmount || parseInt(payAmount, 10) <= 0) && styles.saveBtnDisabled,
          ]}
        >
          <Text style={styles.primaryBtnText}>Save payment</Text>
        </PressableScale>
      </BottomSheet>
    </ScreenContainer>
  );
}

function ActiveSummary({ debt, pct }: { debt: Debt; pct: number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryHint}>Amount remaining</Text>
      <Text style={styles.summaryAmount}>{formatCurrency(debt.remaining)}</Text>
      {debt.status === "partial" ? (
        <View style={styles.partialBlock}>
          <View style={styles.partialMeta}>
            <Text style={styles.partialMetaText}>Original: {formatCurrency(debt.amount)}</Text>
            <Text style={styles.partialMetaText}>{Math.round(pct)}% paid</Text>
          </View>
          <View style={styles.progressTrackLg}>
            <View style={[styles.progressFillLg, { width: `${pct}%` }]} />
          </View>
        </View>
      ) : null}
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

function PaidSummary({ debt, firstName }: { debt: Debt; firstName: string }) {
  const lastPayment = debt.payments[debt.payments.length - 1];

  return (
    <View style={styles.paidCard}>
      <View style={styles.paidIcon}>
        <Check color="#16A34A" size={24} strokeWidth={2.5} />
      </View>
      <Text style={styles.paidTitle}>Settled</Text>
      <Text style={styles.paidCopy}>{firstName} has fully paid this amount.</Text>
      <Text style={styles.paidAmount}>{formatCurrency(debt.amount)}</Text>
      {lastPayment ? <Text style={styles.paidDate}>Paid {lastPayment.date}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minWidth: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A18",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A18",
    marginTop: 16,
  },
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryHint: {
    fontSize: 12,
    color: "#B8B8B0",
    fontWeight: "500",
  },
  summaryAmount: {
    fontSize: 34,
    fontWeight: "700",
    color: "#1A1A18",
    lineHeight: 36,
    marginTop: 2,
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
    color: "#8A8A82",
  },
  progressTrackLg: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFillLg: {
    height: "100%",
    backgroundColor: "#818CF8",
    borderRadius: 999,
  },
  summaryFooter: {
    flexDirection: "row",
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  summaryFooterLabel: {
    fontSize: 11,
    color: "#B8B8B0",
    fontWeight: "500",
  },
  summaryFooterValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A18",
    marginTop: 2,
  },
  paidCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paidIcon: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  paidTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#065F46",
  },
  paidCopy: {
    fontSize: 14,
    color: "#059669",
    marginTop: 4,
  },
  paidAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#047857",
    marginTop: 12,
    fontVariant: ["tabular-nums"],
  },
  paidDate: {
    fontSize: 12,
    color: "#10B981",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B8B8B0",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  cardLabelSpaced: {
    marginBottom: 16,
  },
  cardBody: {
    fontSize: 14,
    color: "#1A1A18",
    marginTop: 6,
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
    backgroundColor: "#34D399",
    marginTop: 4,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: "#EFEFEC",
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
    color: "#1A1A18",
    fontVariant: ["tabular-nums"],
  },
  paymentDate: {
    fontSize: 12,
    color: "#B8B8B0",
  },
  paymentNote: {
    fontSize: 12,
    color: "#8A8A82",
    marginTop: 2,
  },
  messageBox: {
    fontSize: 14,
    color: "#4A4A42",
    lineHeight: 22,
    backgroundColor: "#F7F5F1",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  copyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A3A2A",
  },
  copyTextSuccess: {
    color: "#16A34A",
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
    backgroundColor: "#1A3A2A",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  saveBtnDisabled: {
    opacity: 0.3,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A18",
  },
  sheetField: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A8A82",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  prefix: {
    position: "absolute",
    left: 16,
    top: 18,
    fontSize: 14,
    fontWeight: "700",
    color: "#8A8A82",
    zIndex: 1,
  },
  sheetInput: {
    backgroundColor: "#F7F5F1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    color: "#1A1A18",
  },
  amountInput: {
    paddingLeft: 60,
    fontSize: 20,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  fullAmountLink: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#1A3A2A",
  },
});
