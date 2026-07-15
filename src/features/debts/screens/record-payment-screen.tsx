import { useCallback, useLayoutEffect, useState } from "react";

import { ScrollView, Text, TextInput, View } from "react-native";

import { Stack, router, useLocalSearchParams, useNavigation } from "expo-router";

import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { HeaderSaveButton } from "@/components/navigation/header-save-button";
import { PressableScale } from "@/components/shared/pressable-scale";
import {
  KEYBOARD_DONE_ACCESSORY_ID,
  KeyboardDoneAccessory,
} from "@/components/ui/keyboard-done-accessory";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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

  const reduceMotion = useReducedMotion();
  const amountPulse = useSharedValue(1);
  const amountPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: amountPulse.value }],
  }));

  const parsedAmount = parseInt(payAmount, 10);
  const canSave = Boolean(debt) && parsedAmount > 0 && parsedAmount <= (debt?.remaining ?? 0);

  const fillFullRemaining = useCallback(() => {
    if (!debt) return;
    setPayAmount(String(debt.remaining));
    if (!reduceMotion) {
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value mutated by design
      amountPulse.value = withSequence(
        withTiming(1.06, { duration: 120 }),
        withTiming(1, { duration: 160 }),
      );
    }
  }, [amountPulse, debt, reduceMotion]);

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
    return <LoadingSpinner />;
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
    <>
      <ScrollView
        contentContainerStyle={styles.form}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          {debt.name} · {formatCurrency(debt.remaining, debt.currency)} remaining
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Amount paid</Text>
          <View style={styles.inputCard}>
            <Animated.View style={amountPulseStyle}>
              <Text style={styles.prefix}>{formatCurrencyPrefix(debt.currency)}</Text>
              <TextInput
                autoFocus
                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                keyboardType="number-pad"
                onChangeText={setPayAmount}
                placeholder="0"
                placeholderTextColor={theme.colors.sheetHandle}
                returnKeyType="done"
                style={[styles.input, styles.amountInput]}
                value={payAmount}
              />
            </Animated.View>
          </View>
          <PressableScale onPress={fillFullRemaining} style={styles.fullAmountButton}>
            <Text style={styles.fullAmountLink}>
              Mark full remaining ({formatCurrency(debt.remaining, debt.currency)})
            </Text>
          </PressableScale>
          {parsedAmount > debt.remaining ? (
            <Text style={styles.errorText}>
              Amount cannot exceed {formatCurrency(debt.remaining, debt.currency)} remaining
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Note (optional)</Text>
          <View style={styles.inputCard}>
            <TextInput
              onChangeText={setPayNote}
              placeholder="e.g. M-Pesa, cash, bank transfer"
              placeholderTextColor={theme.colors.placeholder}
              returnKeyType="done"
              style={styles.input}
              value={payNote}
            />
          </View>
        </View>
      </ScrollView>
      <KeyboardDoneAccessory />
    </>
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
  subtitle: {
    fontSize: 13,
    color: theme.colors.muted,
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
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  fullAmountButton: {
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.danger,
  },
}));
