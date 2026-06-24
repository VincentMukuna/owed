import { useState } from "react";

import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { ArrowLeft, Bell } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/shared/icon-button";
import { PressableScale } from "@/components/shared/pressable-scale";
import { ScreenContainer } from "@/components/shared/screen-container";
import { useAppStore } from "@/features/debts/store/app-store";
import type { NewDebt } from "@/features/debts/types";
import { getInitials } from "@/lib/utils/formatters";

const QUICK_DATES = ["Today", "Tomorrow", "Friday", "Next week"];

export function AddDebtScreen() {
  const insets = useSafeAreaInsets();
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
    router.back();
  };

  return (
    <ScreenContainer padded={false} style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <IconButton onPress={() => router.back()}>
          <ArrowLeft color="#4A4A42" size={16} strokeWidth={2} />
        </IconButton>
        <Text style={styles.title}>Add debt</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: 144 + insets.bottom }]}
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
            onValueChange={setReminder}
            thumbColor="#FFFFFF"
            trackColor={{ false: "#DDDDD8", true: "#1A3A2A" }}
            value={reminder}
          />
        </View>
      </ScrollView>

      <LinearGradient
        colors={["rgba(247,245,241,0)", "rgba(247,245,241,0.95)", "#F7F5F1"]}
        style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}
      >
        <PressableScale
          disabled={!canSave}
          onPress={handleSave}
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        >
          <Text style={styles.saveBtnText}>Save debt</Text>
        </PressableScale>
      </LinearGradient>
    </ScreenContainer>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A18",
  },
  form: {
    paddingHorizontal: 20,
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
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  saveBtn: {
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
  saveBtnDisabled: {
    opacity: 0.3,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
