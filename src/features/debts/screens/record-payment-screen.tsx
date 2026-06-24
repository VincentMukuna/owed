import { useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Stack, router, useLocalSearchParams } from "expo-router";

import { HeaderSaveButton } from "@/components/navigation/header-save-button";
import { useAppStore } from "@/features/debts/store/app-store";
import { formatCurrency } from "@/lib/utils/formatters";

export function RecordPaymentScreen() {
  const { debtId } = useLocalSearchParams<{ debtId: string }>();
  const debt = useAppStore((s) => s.getDebt(Number(debtId)));
  const addPayment = useAppStore((s) => s.addPayment);

  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const parsedAmount = parseInt(payAmount, 10);
  const canSave = Boolean(debt) && parsedAmount > 0;

  const handleSave = () => {
    if (!debt || !canSave) return;
    addPayment(debt.id, parsedAmount, payNote);
    router.back();
  };

  if (!debt) {
    return (
      <>
        <Stack.Screen options={{ title: "Add payment" }} />
        <View style={styles.missing}>
          <Text style={styles.missingText}>Debt not found</Text>
        </View>
      </>
    );
  }

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
        <View style={styles.field}>
          <Text style={styles.label}>Amount paid</Text>
          <View>
            <Text style={styles.prefix}>KES</Text>
            <TextInput
              autoFocus
              keyboardType="number-pad"
              onChangeText={setPayAmount}
              placeholder="0"
              placeholderTextColor="#DDDDD8"
              style={[styles.input, styles.amountInput]}
              value={payAmount}
            />
          </View>
          <Pressable onPress={() => setPayAmount(String(debt.remaining))}>
            <Text style={styles.fullAmountLink}>
              Mark full remaining ({formatCurrency(debt.remaining)})
            </Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            onChangeText={setPayNote}
            placeholder="e.g. M-Pesa, cash, bank transfer"
            placeholderTextColor="#C8C8C0"
            style={styles.input}
            value={payNote}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  missingText: {
    fontSize: 16,
    color: "#8A8A82",
  },
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
  prefix: {
    position: "absolute",
    left: 16,
    top: 18,
    fontSize: 14,
    fontWeight: "700",
    color: "#8A8A82",
    zIndex: 1,
  },
  input: {
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
