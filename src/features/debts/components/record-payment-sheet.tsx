import {
  type ComponentType,
  type ElementRef,
  type ReactNode,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { ActivityIndicator, Platform, Text, View } from "react-native";

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { FullWindowOverlay } from "react-native-screens";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { useRecordPayment } from "@/features/debts/hooks/use-record-payment";
import { formatCurrency, formatCurrencyPrefix } from "@/lib/utils/formatters";

import type { DebtCardView, DebtDetailView } from "../view-models";

type RecordPaymentSheetProps = {
  debt?: DebtCardView | DebtDetailView | null;
  onSaved?: () => void;
};

export type RecordPaymentSheetRef = {
  present: () => void;
  dismiss: () => void;
};

const SHEET_CONTAINER = (Platform.OS === "ios" ? FullWindowOverlay : undefined) as
  | ComponentType<{ children?: ReactNode }>
  | undefined;

export const RecordPaymentSheet = forwardRef<RecordPaymentSheetRef, RecordPaymentSheetProps>(
  ({ debt, onSaved }, ref) => {
    const { theme } = useUnistyles();
    const sheetRef = useRef<BottomSheetModal>(null);
    const inputRef = useRef<ElementRef<typeof BottomSheetTextInput>>(null);
    const recordPayment = useRecordPayment();
    const [payAmount, setPayAmount] = useState("");
    const [payNote, setPayNote] = useState("");
    const snapPoints = useMemo(() => ["90%"], []);

    const parsedAmount = parseInt(payAmount, 10);
    const canSave = Boolean(debt) && parsedAmount > 0 && parsedAmount <= (debt?.remaining ?? 0);
    const isOverRemaining = Boolean(debt) && parsedAmount > (debt?.remaining ?? 0);

    const close = useCallback(() => {
      sheetRef.current?.dismiss();
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        present: () => sheetRef.current?.present(),
        dismiss: close,
      }),
      [close],
    );

    const handleSave = useCallback(() => {
      if (!debt || !canSave) return;

      recordPayment.mutate(
        {
          debtId: debt.id,
          input: {
            amount: parsedAmount,
            note: payNote.trim() || undefined,
          },
          remainingBeforePayment: debt.remaining,
        },
        {
          onSuccess: () => {
            close();
            onSaved?.();
          },
        },
      );
    }, [canSave, close, debt, onSaved, parsedAmount, payNote, recordPayment]);

    const handleSheetChange = useCallback((index: number) => {
      if (index >= 0) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }, []);

    const handleDismiss = useCallback(() => {
      setPayAmount("");
      setPayNote("");
    }, []);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior={recordPayment.isPending ? "none" : "close"}
        />
      ),
      [recordPayment.isPending],
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose={!recordPayment.isPending}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        containerComponent={SHEET_CONTAINER}
        onChange={handleSheetChange}
        onDismiss={handleDismiss}
        handleIndicatorStyle={styles.handle}
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <Text style={styles.title}>Add Payment</Text>
            {debt ? (
              <Text style={styles.subtitle}>
                {debt.name} · {formatCurrency(debt.remaining, debt.currency)} remaining
              </Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Amount paid</Text>
            <View style={styles.inputCard}>
              <View>
                <Text style={styles.prefix}>
                  {debt ? formatCurrencyPrefix(debt.currency) : formatCurrencyPrefix()}
                </Text>
                <BottomSheetTextInput
                  ref={inputRef}
                  keyboardType="number-pad"
                  onChangeText={setPayAmount}
                  placeholder="0"
                  placeholderTextColor={theme.colors.sheetHandle}
                  style={[styles.input, styles.amountInput]}
                  value={payAmount}
                />
              </View>
              {debt ? (
                <PressableScale onPress={() => setPayAmount(String(debt.remaining))}>
                  <Text style={styles.fullAmountLink}>
                    Mark full remaining ({formatCurrency(debt.remaining, debt.currency)})
                  </Text>
                </PressableScale>
              ) : null}
              {isOverRemaining && debt ? (
                <Text style={styles.errorText}>
                  Amount cannot exceed {formatCurrency(debt.remaining, debt.currency)} remaining
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Note (optional)</Text>
            <View style={styles.inputCard}>
              <BottomSheetTextInput
                onChangeText={setPayNote}
                placeholder="e.g. M-Pesa, cash, bank transfer"
                placeholderTextColor={theme.colors.placeholder}
                style={styles.input}
                value={payNote}
              />
            </View>
          </View>

          <PressableScale
            disabled={!canSave || recordPayment.isPending}
            onPress={handleSave}
            style={[styles.saveButton, (!canSave || recordPayment.isPending) && styles.disabled]}
          >
            {recordPayment.isPending ? (
              <ActivityIndicator color={theme.colors.primaryForeground} />
            ) : (
              <Text style={styles.saveText}>Save payment</Text>
            )}
          </PressableScale>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

RecordPaymentSheet.displayName = "RecordPaymentSheet";

const styles = StyleSheet.create((theme) => ({
  sheetBackground: {
    backgroundColor: theme.colors.sheet,
  },
  handle: {
    backgroundColor: theme.colors.sheetHandle,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 56,
    gap: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: 4,
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
  saveButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.45,
  },
  saveText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.primaryForeground,
  },
}));
