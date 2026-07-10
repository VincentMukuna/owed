import { useCallback, useLayoutEffect, useState } from "react";

import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Stack, router, useLocalSearchParams, useNavigation } from "expo-router";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { HeaderSaveButton } from "@/components/navigation/header-save-button";
import { FormScreenSkeleton } from "@/components/ui/screen-skeletons";
import { useDebt } from "@/features/debts/hooks/use-debt";
import { useRecordPayment } from "@/features/debts/hooks/use-record-payment";
import { formatCurrency, formatCurrencyPrefix } from "@/lib/utils/formatters";

export function RecordPaymentScreen() {
  const { theme } = useUnistyles();
  const navigation = useNavigation();
  const { debtId } = useLocalSearchParams<{ debtId: string }>();
  const { data: debt, isPending } = useDebt(debtId);
  const recordPayment = useRecordPayment();

  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const parsedAmount = parseInt(payAmount, 10);
  const canSave = Boolean(debt) && parsedAmount > 0 && parsedAmount <= (debt?.remaining ?? 0);

  const handleSave = useCallback(() => {
    if (!debt || !canSave || !debtId) return;

    recordPayment.mutate(
      {
        debtId,
        input: {
          amount: parsedAmount,
          note: payNote.trim() || undefined,
        },
        remainingBeforePayment: debt.remaining,
      },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  }, [canSave, debt, debtId, parsedAmount, payNote, recordPayment]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderSaveButton
          disabled={!canSave || recordPayment.isPending}
          label={recordPayment.isPending ? "Saving…" : "Save"}
          onPress={handleSave}
        />
      ),
    });
  }, [canSave, handleSave, navigation, recordPayment.isPending]);

  if (isPending) {
    return <FormScreenSkeleton />;
  }

  if (!debt) {
    return (
      <>
        <Stack.Screen options={{ title: "Add Payment" }} />
        <View style={styles.missing}>
          <Text style={styles.missingText}>Debt not found</Text>
        </View>
      </>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.form}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.field}>
        <Text style={styles.label}>Amount paid</Text>
        <View style={styles.inputCard}>
          <View>
            <Text style={styles.prefix}>{formatCurrencyPrefix(debt.currency)}</Text>
            <TextInput
              autoFocus
              keyboardType="number-pad"
              onChangeText={setPayAmount}
              placeholder="0"
              placeholderTextColor={theme.colors.sheetHandle}
              style={[styles.input, styles.amountInput]}
              value={payAmount}
            />
          </View>
          <Pressable onPress={() => setPayAmount(String(debt.remaining))}>
            <Text style={styles.fullAmountLink}>
              Mark full remaining ({formatCurrency(debt.remaining, debt.currency)})
            </Text>
          </Pressable>
          {parsedAmount > debt.remaining ? (
            <Text style={styles.errorText}>
              Amount cannot exceed {formatCurrency(debt.remaining, debt.currency)} remaining
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Note (optional)</Text>
        <View style={styles.inputCard}>
          <TextInput
            onChangeText={setPayNote}
            placeholder="e.g. M-Pesa, cash, bank transfer"
            placeholderTextColor={theme.colors.placeholder}
            style={styles.input}
            value={payNote}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  missingText: {
    fontSize: 16,
    color: theme.colors.muted,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
    gap: 18,
  },
  field: {
    gap: 8,
  },
  inputCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.name === "light" ? 0.025 : 0.05,
    shadowRadius: theme.name === "light" ? 1.5 : 2,
    elevation: theme.name === "light" ? 0 : 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  prefix: {
    position: "absolute",
    left: 0,
    top: 8,
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.muted,
    zIndex: 1,
  },
  input: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    fontSize: 14,
    color: theme.colors.text,
  },
  amountInput: {
    paddingLeft: 48,
    fontSize: 20,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  fullAmountLink: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.danger,
  },
}));
