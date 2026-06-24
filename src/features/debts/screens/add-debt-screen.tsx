import { useState } from "react";

import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { Stack, router, useLocalSearchParams } from "expo-router";

import { Bell } from "lucide-react-native";

import { HeaderSaveButton } from "@/components/navigation/header-save-button";
import { PressableScale } from "@/components/shared/pressable-scale";
import { useAppStore } from "@/features/debts/store/app-store";
import type { NewDebt } from "@/features/debts/types";
import { selectionChange } from "@/lib/haptics";
import { getInitials } from "@/lib/utils/formatters";

const QUICK_DATES = ["Today", "Tomorrow", "Friday", "Next week"];

function exitAddDebt() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace("/(tabs)/index");
}

export function AddDebtScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromOnboarding = from === "onboarding";
  const addDebt = useAppStore((s) => s.addDebt);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reason, setReason] = useState("");
  const [reminder, setReminder] = useState(false);
  const [quickDate, setQuickDate] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && parseInt(amount, 10) > 0;

  const handleSave = () => {
    if (!canSave) return;

    const payload: NewDebt = {
      name: name.trim(),
      initials: getInitials(name),
      amount: parseInt(amount, 10),
      remaining: parseInt(amount, 10),
      dueDate: quickDate || dueDate || "—",
      reason: reason.trim() || "—",
      status: "active",
      addedDate: "Jun 24",
      reminder,
    };

    addDebt(payload);
    if (fromOnboarding) {
      router.replace("/(tabs)/index");
      return;
    }
    exitAddDebt();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderSaveButton disabled={!canSave} label="Save" onPress={handleSave} />
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Field label="Person">
          <TextInput
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor="#C8C8C0"
            style={styles.input}
            value={name}
          />
        </Field>

        <Field label="Amount">
          <View>
            <Text style={styles.prefix}>KES</Text>
            <TextInput
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
                    setDueDate("");
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
          <TextInput
            onChangeText={(value) => {
              setDueDate(value);
              setQuickDate(null);
            }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#C8C8C0"
            style={styles.input}
            value={dueDate}
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
              selectionChange();
              setReminder(value);
            }}
            thumbColor="#FFFFFF"
            trackColor={{ false: "#DDDDD8", true: "#1A3A2A" }}
            value={reminder}
          />
        </View>
      </ScrollView>
    </>
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
});
