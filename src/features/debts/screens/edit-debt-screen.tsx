import { useCallback, useLayoutEffect, useMemo, useState } from "react";

import { ScrollView, Switch, Text, TextInput, View } from "react-native";

import { Stack, router, useLocalSearchParams, useNavigation } from "expo-router";

import { Calendar } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { HeaderSaveButton } from "@/components/navigation/header-save-button";
import { PressableScale } from "@/components/shared/pressable-scale";
import {
  KEYBOARD_DONE_ACCESSORY_ID,
  KeyboardDoneAccessory,
} from "@/components/ui/keyboard-done-accessory";
import { FormScreenSkeleton } from "@/components/ui/screen-skeletons";
import { DueDatePickerModal } from "@/features/debts/components/due-date-picker-modal";
import { useDebt } from "@/features/debts/hooks/use-debt";
import { useUpdateDebt } from "@/features/debts/hooks/use-update-debt";
import { formatDueDate } from "@/features/debts/lib/format-dates";
import { selectionChange } from "@/lib/haptics";
import { formatCurrency, formatCurrencyPrefix, getInitials } from "@/lib/utils/formatters";

export function EditDebtScreen() {
  const { theme } = useUnistyles();
  const navigation = useNavigation();
  const { debtId } = useLocalSearchParams<{ debtId: string }>();
  const { data: debt, isPending } = useDebt(debtId);
  const updateDebt = useUpdateDebt();

  const [amount, setAmount] = useState("");
  const [dueDateIso, setDueDateIso] = useState("");
  const [reason, setReason] = useState("");
  const [reminder, setReminder] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [hydratedDebtId, setHydratedDebtId] = useState<string | null>(null);

  if (debt && hydratedDebtId !== debt.id) {
    setAmount(String(debt.amount));
    setDueDateIso(debt.dueDateISO);
    setReason(debt.reason);
    setReminder(debt.reminder);
    setHydratedDebtId(debt.id);
  }

  const totalPaid = useMemo(() => {
    if (!debt) return 0;
    return debt.amount - debt.remaining;
  }, [debt]);
  const parsedAmount = parseInt(amount, 10);
  const remainingAfterSave =
    Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount - totalPaid : 0;
  const amountBelowPaid = Boolean(debt) && parsedAmount < totalPaid;
  const canSave =
    Boolean(debt) &&
    parsedAmount > 0 &&
    !amountBelowPaid &&
    dueDateIso.length > 0 &&
    !updateDebt.isPending;
  const showReminder = debt ? debt.status !== "paid" : false;

  const handleSave = useCallback(() => {
    if (!debt || !canSave || !debtId) return;

    updateDebt.mutate(
      {
        debtId,
        input: {
          originalAmount: parsedAmount,
          dueDate: dueDateIso,
          reason: reason.trim() || undefined,
          reminderEnabled: showReminder ? reminder : false,
        },
      },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  }, [canSave, debt, debtId, dueDateIso, parsedAmount, reason, reminder, showReminder, updateDebt]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderSaveButton
          disabled={!canSave}
          label={updateDebt.isPending ? "Saving…" : "Save"}
          onPress={handleSave}
        />
      ),
    });
  }, [canSave, handleSave, navigation, updateDebt.isPending]);

  if (isPending) {
    return <FormScreenSkeleton />;
  }

  if (!debt) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Debt" }} />
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
        <Field label="Person">
          <View style={styles.personChipDisabled}>
            <View style={styles.personAvatarDisabled}>
              <Text style={styles.personAvatarTextDisabled}>{getInitials(debt.name)}</Text>
            </View>
            <Text numberOfLines={1} style={styles.personChipNameDisabled}>
              {debt.name}
            </Text>
          </View>
        </Field>

        <Field
          label="Amount"
          footer={
            totalPaid > 0 ? (
              <Text style={[styles.helper, amountBelowPaid && styles.errorText]}>
                {amountBelowPaid
                  ? `Amount can't be less than ${formatCurrency(totalPaid, debt.currency)} already paid`
                  : `${formatCurrency(totalPaid, debt.currency)} already paid · ${formatCurrency(
                      Math.max(remainingAfterSave, 0),
                      debt.currency,
                    )} remaining after save`}
              </Text>
            ) : null
          }
        >
          <View>
            <Text style={styles.prefix}>{formatCurrencyPrefix(debt.currency)}</Text>
            <TextInput
              inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
              keyboardType="number-pad"
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={theme.colors.sheetHandle}
              returnKeyType="done"
              style={[styles.input, styles.amountInput]}
              value={amount}
            />
          </View>
        </Field>

        <Field label="Promised date">
          <PressableScale
            onPress={() => {
              selectionChange();
              setDatePickerOpen(true);
            }}
            style={styles.dateField}
          >
            <View>
              <Text style={styles.dateValue}>{formatDueDate(dueDateIso)}</Text>
            </View>
            <Calendar color={theme.colors.icon} size={18} strokeWidth={1.8} />
          </PressableScale>
        </Field>

        <Field label="Reason">
          <TextInput
            multiline
            onChangeText={setReason}
            placeholder="What this is about"
            placeholderTextColor={theme.colors.placeholder}
            returnKeyType="done"
            style={[styles.input, styles.reasonInput]}
            value={reason}
          />
        </Field>

        {showReminder ? (
          <View style={styles.reminderRow}>
            <View style={styles.reminderCopy}>
              <Text style={styles.reminderTitle}>Remind me</Text>
              <Text style={styles.reminderSub}>On the promised date</Text>
            </View>
            <Switch
              onValueChange={(value) => {
                selectionChange();
                setReminder(value);
              }}
              trackColor={{ false: theme.colors.borderStrong, true: theme.colors.primary }}
              value={reminder}
            />
          </View>
        ) : null}
      </ScrollView>

      <DueDatePickerModal
        visible={datePickerOpen}
        value={dueDateIso}
        onClose={() => setDatePickerOpen(false)}
        onSave={setDueDateIso}
      />
      <KeyboardDoneAccessory />
    </>
  );
}

function Field({
  label,
  children,
  footer,
}: {
  label: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={styles.inputCard}>{children}</View>
      {footer}
    </View>
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
    paddingBottom: 40,
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
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  prefix: {
    position: "absolute",
    left: 0,
    top: 10,
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
  personChipDisabled: {
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    opacity: 0.58,
  },
  personAvatarDisabled: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceMuted,
  },
  personAvatarTextDisabled: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.muted,
  },
  personChipNameDisabled: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.muted,
  },
  amountInput: {
    paddingLeft: 48,
    paddingVertical: 2,
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  helper: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.muted,
  },
  errorText: {
    color: theme.colors.danger,
    fontWeight: "600",
  },
  dateField: {
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateValue: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  reasonInput: {
    minHeight: 82,
    textAlignVertical: "top",
  },
  reminderRow: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  reminderCopy: {
    flex: 1,
    gap: 2,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  reminderSub: {
    fontSize: 12,
    color: theme.colors.muted,
  },
}));
