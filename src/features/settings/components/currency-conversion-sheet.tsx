import {
  type ComponentType,
  type ReactNode,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { ActivityIndicator, Platform, StyleSheet, Text, type TextInput, View } from "react-native";

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { FullWindowOverlay } from "react-native-screens";

import { PressableScale } from "@/components/shared/pressable-scale";
import { useSuggestedExchangeRate } from "@/features/settings/hooks/use-suggested-exchange-rate";
import {
  formatRateDate,
  formatRateForInput,
} from "@/features/settings/lib/fetch-suggested-exchange-rate";
import { parseExchangeRate } from "@/features/settings/lib/parse-exchange-rate";
import { formatCurrency } from "@/lib/utils/formatters";

const SHEET_CONTAINER = (Platform.OS === "ios" ? FullWindowOverlay : undefined) as
  | ComponentType<{ children?: ReactNode }>
  | undefined;

export type CurrencyConversionSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type CurrencyConversionSheetProps = {
  fromCurrency: string;
  toCurrency: string;
  totalRemaining: number;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (rate: number) => void;
};

export const CurrencyConversionSheet = forwardRef<
  CurrencyConversionSheetRef,
  CurrencyConversionSheetProps
>(({ fromCurrency, toCurrency, totalRemaining, isSubmitting, onClose, onConfirm }, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const inputRef = useRef<TextInput>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [userRateText, setUserRateText] = useState<string | null>(null);
  const snapPoints = useMemo(() => ["90%"], []);

  const {
    data: suggestedRate,
    isPending: isSuggestedRatePending,
    isSuccess: isSuggestedRateSuccess,
  } = useSuggestedExchangeRate({
    fromCurrency,
    toCurrency,
    enabled: isOpen,
  });

  const rateText = useMemo(() => {
    if (userRateText !== null) {
      return userRateText;
    }

    if (!suggestedRate) {
      return "";
    }

    return formatRateForInput(suggestedRate.rate);
  }, [userRateText, suggestedRate]);

  useImperativeHandle(
    ref,
    () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }),
    [],
  );

  const rate = useMemo(() => parseExchangeRate(rateText), [rateText]);
  const convertedTotal = rate === undefined ? undefined : Math.round(totalRemaining * rate);

  const close = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const handleConfirm = useCallback(() => {
    if (rate === undefined) {
      return;
    }

    onConfirm(rate);
  }, [onConfirm, rate]);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setUserRateText(null);
    onClose();
  }, [onClose]);

  const handleRateChange = useCallback((text: string) => {
    setUserRateText(text);
  }, []);

  const handleSheetChange = useCallback((index: number) => {
    const open = index >= 0;
    setIsOpen(open);

    if (open) {
      setUserRateText(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={isSubmitting ? "none" : "close"}
      />
    ),
    [isSubmitting],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={!isSubmitting}
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
        <Text style={styles.title}>Switch to {toCurrency}?</Text>
        <Text style={styles.subtitle}>
          We&apos;ll suggest a rate to convert your amounts from {fromCurrency} to {toCurrency}.
          Adjust it if needed before confirming.
        </Text>

        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>1 {fromCurrency} =</Text>
          <BottomSheetTextInput
            ref={inputRef as never}
            editable={!isSubmitting}
            keyboardType="decimal-pad"
            onChangeText={handleRateChange}
            placeholder="0.00"
            placeholderTextColor="#B0B0A8"
            style={styles.rateInput}
            value={rateText}
          />
          <Text style={styles.rateSuffix}>{toCurrency}</Text>
        </View>

        {isSuggestedRatePending ? (
          <Text style={styles.rateHint}>Fetching suggested rate…</Text>
        ) : null}
        {isSuggestedRateSuccess && suggestedRate ? (
          <Text style={styles.rateHint}>
            Suggested rate ({formatRateDate(suggestedRate.date)}). Confirm before converting.
          </Text>
        ) : null}

        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Total owed</Text>
          <Text style={styles.previewValue}>
            {formatCurrency(totalRemaining, fromCurrency)}
            {convertedTotal !== undefined ? (
              <Text style={styles.previewArrow}>
                {" "}
                → {formatCurrency(convertedTotal, toCurrency)}
              </Text>
            ) : (
              <Text style={styles.previewMuted}> → …</Text>
            )}
          </Text>
        </View>

        <PressableScale
          disabled={rate === undefined || isSubmitting}
          onPress={handleConfirm}
          style={[styles.confirmButton, (rate === undefined || isSubmitting) && styles.disabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmText}>Convert & switch</Text>
          )}
        </PressableScale>

        <PressableScale disabled={isSubmitting} onPress={close} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </PressableScale>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

CurrencyConversionSheet.displayName = "CurrencyConversionSheet";

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#FBFBF8",
  },
  handle: {
    backgroundColor: "#DDDDD8",
    width: 36,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A18",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#8A8A82",
  },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rateLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A18",
  },
  rateInput: {
    flex: 1,
    minWidth: 80,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1A1A18",
    backgroundColor: "#FFFFFF",
  },
  rateSuffix: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A18",
  },
  rateHint: {
    fontSize: 12,
    lineHeight: 17,
    color: "#8A8A82",
    marginTop: -8,
  },
  previewCard: {
    borderRadius: 14,
    backgroundColor: "#F5F5F0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8A8A82",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A18",
  },
  previewArrow: {
    color: "#1A3A2A",
  },
  previewMuted: {
    color: "#B0B0A8",
  },
  confirmButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#1A3A2A",
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8A8A82",
  },
  disabled: {
    opacity: 0.5,
  },
});
