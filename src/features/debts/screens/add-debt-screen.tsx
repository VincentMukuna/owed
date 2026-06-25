import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { router, useLocalSearchParams, useNavigation } from "expo-router";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Bell, Calendar, ChevronRight, X } from "lucide-react-native";

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
import { selectionChange } from "@/lib/haptics";
import { HOME_ROUTE } from "@/lib/navigation/routes";
import { getInitials } from "@/lib/utils/formatters";

const QUICK_DATES = ["Today", "Tomorrow", "Friday", "Next week"];

function exitAddDebt() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(HOME_ROUTE);
}

export function AddDebtScreen() {
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
  }, [addDebt, canSave, dueDateIso, fromOnboarding, person, parsedAmount, reason, reminder]);

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
                <X color="#8A8A82" size={18} strokeWidth={2} />
              </PressableScale>
            </View>
          ) : (
            <PressableScale onPress={openPicker} style={styles.personField}>
              <Text style={styles.personPlaceholder}>Who owes you?</Text>
              <ChevronRight color="#C8C8C0" size={18} strokeWidth={2} />
            </PressableScale>
          )}
        </Field>

        <Field label="Amount">
          <View>
            <Text style={styles.prefix}>KES</Text>
            <TextInput
              ref={amountRef}
              keyboardType="number-pad"
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="#DDDDD8"
              style={[styles.input, styles.amountInput]}
              value={amount}
            />
          </View>
        </Field>

        <Field label="Promised date">
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
          <PressableScale
            onPress={() => {
              selectionChange();
              setDatePickerOpen(true);
            }}
            style={styles.dateField}
          >
            <Calendar color="#8A8A82" size={16} strokeWidth={1.5} />
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
            placeholderTextColor="#C8C8C0"
            style={styles.input}
            value={reason}
          />
        </Field>

        <View>
          <View style={styles.reminderRow}>
            <View style={styles.reminderCopy}>
              <Bell color="#8A8A82" size={16} strokeWidth={1.5} />
              <View>
                <Text style={styles.reminderTitle}>Remind me</Text>
                <Text style={styles.reminderSub}>On the promised date</Text>
              </View>
            </View>
            <Switch
              onValueChange={(value) => {
                void handleReminderToggle(value);
              }}
              thumbColor="#FFFFFF"
              trackColor={{ false: "#DDDDD8", true: "#1A3A2A" }}
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
                Notifications are off. You&apos;ll still see reminders in the app. Turn on in
                Settings.
              </Text>
            </PressableScale>
          ) : null}
        </View>
      </ScrollView>

      <PersonPickerSheet ref={pickerRef} onSelect={handlePersonSelect} people={people} />
    </BottomSheetModalProvider>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A8A82",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#1A1A18",
  },
  personField: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  personPlaceholder: {
    fontSize: 14,
    color: "#C8C8C0",
  },
  personChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 12,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 8,
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
    backgroundColor: "#ECEBE4",
  },
  personAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4A4A42",
  },
  personChipName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A18",
  },
  personClear: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
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
  amountInput: {
    paddingLeft: 60,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#FFFFFF",
  },
  chipSelected: {
    backgroundColor: "#1A3A2A",
    borderColor: "transparent",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4A4A42",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  dateField: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateFieldText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A18",
  },
  reminderRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reminderCopy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A18",
  },
  reminderSub: {
    fontSize: 12,
    color: "#8A8A82",
  },
  permHint: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  permHintText: {
    fontSize: 12,
    color: "#D97706",
    lineHeight: 18,
  },
});
