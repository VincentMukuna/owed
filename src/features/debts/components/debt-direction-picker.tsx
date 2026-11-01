import { Text, View } from "react-native";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import type { DebtDirection } from "@/features/debts/view-models";
import { selectionChange } from "@/lib/haptics";

const DIRECTION_OPTIONS: { value: DebtDirection; label: string }[] = [
  { value: "they_owe_me", label: "They owe me" },
  { value: "i_owe_them", label: "I owe them" },
];

export function DebtDirectionPicker({
  direction,
  onChange,
}: {
  direction: DebtDirection;
  onChange: (direction: DebtDirection) => void;
}) {
  const { theme } = useUnistyles();
  return (
    <View style={styles.segmented}>
      {DIRECTION_OPTIONS.map((option) => {
        const selected = direction === option.value;
        const Icon = option.value === "they_owe_me" ? ArrowDownLeft : ArrowUpRight;
        return (
          <PressableScale
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              selectionChange();
              onChange(option.value);
            }}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Icon
              size={16}
              color={option.value === "they_owe_me" ? theme.colors.success : theme.colors.danger}
            />
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {option.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  segmented: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 16,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  segmentSelected: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.muted,
  },
  segmentTextSelected: {
    color: theme.colors.text,
  },
}));
