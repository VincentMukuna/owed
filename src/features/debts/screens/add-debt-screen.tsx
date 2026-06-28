import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { ScrollView, Switch, Text, TextInput, View } from "react-native";

import { router, useLocalSearchParams, useNavigation } from "expo-router";

import Ionicons from "@expo/vector-icons/Ionicons";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Calendar, ChevronRight, X } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { HeaderSaveButton } from "@/components/navigation/header-save-button";
import { PressableScale } from "@/components/shared/pressable-scale";
import { DueDatePickerModal } from "@/features/debts/components/due-date-picker-modal";
import {
  PersonPickerSheet,
  type PersonPickerSheetRef,
} from "@/features/debts/components/person-picker-sheet";
import { useAddDebt } from "@/features/debts/hooks/use-add-debt";
import { usePeople } from "@/features/debts/hooks/use-people";
import { formatDueDate, resolveQuickDate } from "@/features/debts/lib/format-dates";
import type { CreateDebtInput, PersonRef } from "@/features/debts/view-models";
import { completeOnboarding } from "@/features/onboarding/lib/onboarding-storage";
import {
  type NotificationPermissionState,
  openOsNotificationSettings,
} from "@/features/reminders/lib/notification-permissions";
import { requestReminderPermissionOnToggle } from "@/features/reminders/lib/request-reminder-permissions";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { selectionChange } from "@/lib/haptics";
import { HOME_ROUTE } from "@/lib/navigation/routes";
import { formatCurrencyPrefix, getInitials } from "@/lib/utils/formatters";

const QUICK_DATES = ["Today", "Tomorrow", "Friday", "Next week"];

function exitAddDebt() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(HOME_ROUTE);
}

export function AddDebtScreen() {
  const { theme } = useUnistyles();
  const navigation = useNavigation();
  const {
    from,
    personId,
    personName: presetPersonName,
  } = useLocalSearchParams<{
    from?: string;
    personId?: string;
    personName?: string;
  }>();
  const fromOnboarding = from === "onboarding";
  const addDebt = useAddDebt();
  const { data: people = [] } = usePeople();
  const defaultCurrency = useSettingsStore((state) => state.defaultCurrency);

  const pickerRef = useRef<PersonPickerSheetRef>(null);
  const amountRef = useRef<TextInput>(null);

  const [person, setPerson] = useState<PersonRef | null>(() =>
    personId ? { kind: "existing", id: personId } : null,
  );
  const [personName, setPersonName] = useState(() => presetPersonName ?? "");
  const [amount, setAmount] = useState("");
  const [dueDateIso, setDueDateIso] = useState(() => resolveQuickDate("Today"));
  const [reason, setReason] = useState("");
  const [reminder, setReminder] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>("not-asked");
  const [quickDate, setQuickDate] = useState<string | null>("Today");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const parsedAmount = parseInt(amount, 10);
  const canSave = person !== null && parsedAmount > 0;

  const openPicker = useCallback(() => {
    selectionChange();
    pickerRef.current?.present();
  }, []);

  const clearPerson = useCallback(() => {
    selectionChange();
    setPerson(null);
    setPersonName("");
  }, []);

  const handlePersonSelect = useCallback((ref: PersonRef, displayName: string) => {
    setPerson(ref);
    setPersonName(displayName);
    // Person → amount is the universal path; advance focus once the sheet has
    // animated away so the number pad takes over cleanly.
    setTimeout(() => amountRef.current?.focus(), 350);
  }, []);

  const handleReminderToggle = useCallback(async (value: boolean) => {
    selectionChange();

    if (!value) {
      setReminder(false);
      return;
    }

    setReminder(true);
    const state = await requestReminderPermissionOnToggle();
    setNotifPermission(state);
  }, []);

  const handleSave = useCallback(() => {
    if (!canSave || !person) return;

    const payload: CreateDebtInput = {
      person,
      originalAmount: parsedAmount,
      dueDate: dueDateIso,
      reason: reason.trim() || undefined,
      reminderEnabled: reminder,
      currency: defaultCurrency,
    };

    addDebt.mutate(payload, {
      onSuccess: async () => {
        if (fromOnboarding) {
          await completeOnboarding();
          router.dismissTo(HOME_ROUTE);
          return;
        }
        exitAddDebt();
      },
    });
  }, [addDebt, canSave, defaultCurrency, dueDateIso, fromOnboarding, person, parsedAmount, reason, reminder]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderSaveButton
          disabled={!canSave || addDebt.isPending}
          label={addDebt.isPending ? "Saving…" : "Save"}
          onPress={handleSave}
        />
      ),
    });
  }, [addDebt.isPending, canSave, handleSave, navigation]);

  return (
    <BottomSheetModalProvider>
      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Field label="Person">
          {person ? (
            <View style={styles.personChip}>
              <PressableScale onPress={openPicker} style={styles.personChipMain}>
                <View style={styles.personAvatar}>
                  <Text style={styles.personAvatarText}>{getInitials(personName)}</Text>
                </View>
                <Text numberOfLines={1} style={styles.personChipName}>
                  {personName}
                </Text>
              </PressableScale>
              <PressableScale
                hitSlop={8}
                onPress={clearPerson}
                style={styles.personClear}
                scaleTo={0.9}
              >
                <X color={theme.colors.muted} size={18} strokeWidth={2} />
              </PressableScale>
            </View>
          ) : (
            <PressableScale onPress={openPicker} style={styles.personField}>
              <Text style={styles.personPlaceholder}>Who owes you?</Text>
              <ChevronRight color={theme.colors.placeholder} size={18} strokeWidth={2} />
            </PressableScale>
          )}
        </Field>

        <Field label="Amount">
          <View>
            <Text style={styles.prefix}>{formatCurrencyPrefix(defaultCurrency)}</Text>
            <TextInput
              ref={amountRef}
              keyboardType="number-pad"
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={theme.colors.sheetHandle}
              style={[styles.input, styles.amountInput]}
              value={amount}
            />
          </View>
        </Field>

        <Field
          bare
          footer={
            <View style={styles.chips}>
              {QUICK_DATES.map((label) => {
                const selected = quickDate === label;
                return (
                  <PressableScale
                    key={label}
                    onPress={() => {
                      selectionChange();
                      setQuickDate(label);
                      setDueDateIso(resolveQuickDate(label));
                    }}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {label}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          }
          label="Promised date"
        >
          <PressableScale
            onPress={() => {
              selectionChange();
              setDatePickerOpen(true);
            }}
            style={styles.dateField}
          >
            <Calendar color={theme.colors.muted} size={16} strokeWidth={1.5} />
            <Text style={styles.dateFieldText}>{formatDueDate(dueDateIso)}</Text>
          </PressableScale>
          <DueDatePickerModal
            onClose={() => setDatePickerOpen(false)}
            onSave={(isoDate) => {
              setDueDateIso(isoDate);
              setQuickDate(null);
            }}
            value={dueDateIso}
            visible={datePickerOpen}
          />
        </Field>

        <Field label="Reason">
          <TextInput
            onChangeText={setReason}
            placeholder="e.g. Lunch, rent help, transport, emergency"
            placeholderTextColor={theme.colors.placeholder}
            style={styles.input}
            value={reason}
          />
        </Field>

        <Section title="Preferences">
          <View style={styles.prefRow}>
            <Ionicons color={theme.colors.muted} name="notifications" size={16} />
            <View style={styles.prefCopy}>
              <Text style={styles.prefTitle}>Notify me</Text>
              <Text style={styles.prefSub}>On the promised date, not sent to them</Text>
            </View>
            <Switch
              onValueChange={(value) => {
                void handleReminderToggle(value);
              }}
              thumbColor={theme.colors.primaryForeground}
              trackColor={{ false: theme.colors.switchTrackOff, true: theme.colors.primary }}
              value={reminder}
            />
          </View>

          {reminder && notifPermission === "off" ? (
            <PressableScale
              onPress={() => {
                void openOsNotificationSettings();
              }}
              style={styles.permHint}
            >
              <Text style={styles.permHintText}>
                Push notifications are off. You&apos;ll still see notifications in the app. Turn on
                in Settings.
              </Text>
            </PressableScale>
          ) : null}
        </Section>
      </ScrollView>

      <PersonPickerSheet ref={pickerRef} onSelect={handlePersonSelect} people={people} />
    </BottomSheetModalProvider>
  );
}

function Field({
  label,
  children,
  footer,
  bare = false,
}: {
  label: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  bare?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.sectionTitle}>{label}</Text>
      {bare ? children : <View style={styles.inputCard}>{children}</View>}
      {footer}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.inputCard}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  form: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 18,
  },
  field: {
    gap: 8,
  },
  section: {
    gap: 8,
  },
  inputCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.name === "light" ? 0.025 : 0.05,
    shadowRadius: theme.name === "light" ? 1.5 : 2,
    elevation: theme.name === "light" ? 0 : 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  input: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    fontSize: 14,
    color: theme.colors.text,
  },
  personField: {
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  personPlaceholder: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  personChip: {
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  personChipMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  personAvatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.personNeutralBg,
  },
  personAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.personNeutralText,
  },
  personChipName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  personClear: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
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
  amountInput: {
    paddingLeft: 48,
    paddingVertical: 2,
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: "transparent",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.icon,
  },
  chipTextSelected: {
    color: theme.colors.primaryForeground,
  },
  dateField: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateFieldText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  prefCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
  },
  prefSub: {
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.muted,
  },
  permHint: {
    marginTop: 8,
  },
  permHintText: {
    fontSize: 12,
    color: theme.colors.warning,
    lineHeight: 18,
  },
}));
