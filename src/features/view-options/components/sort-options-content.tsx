import { Text, View } from "react-native";

import { Check } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { selectionChange } from "@/lib/haptics";

import type { SortChoice } from "../types";

type SortOptionsContentProps<TCriterion extends string, TDirection extends string> = {
  criteria: SortChoice<TCriterion>[];
  criterion: TCriterion;
  direction: TDirection;
  directions: SortChoice<TDirection>[];
  onSelectCriterion: (criterion: TCriterion) => void;
  onSelectDirection: (direction: TDirection) => void;
};

export function SortOptionsContent<TCriterion extends string, TDirection extends string>({
  criteria,
  criterion,
  direction,
  directions,
  onSelectCriterion,
  onSelectDirection,
}: SortOptionsContentProps<TCriterion, TDirection>) {
  return (
    <View style={styles.sections}>
      {criteria.length > 1 ? (
        <SortOptionSection
          label="Sort by"
          options={criteria}
          selected={criterion}
          onSelect={onSelectCriterion}
        />
      ) : null}
      {directions.length > 0 ? (
        <SortOptionSection
          label="Order"
          options={directions}
          selected={direction}
          onSelect={onSelectDirection}
        />
      ) : null}
    </View>
  );
}

type SortOptionSectionProps<TValue extends string> = {
  label: string;
  onSelect: (value: TValue) => void;
  options: SortChoice<TValue>[];
  selected: TValue;
};

function SortOptionSection<TValue extends string>({
  label,
  onSelect,
  options,
  selected,
}: SortOptionSectionProps<TValue>) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const active = option.value === selected;

          return (
            <PressableScale
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => {
                if (!active) {
                  selectionChange();
                  onSelect(option.value);
                }
              }}
              style={styles.option}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                {option.label}
              </Text>
              {active ? <Check color={theme.colors.primary} size={18} strokeWidth={2.5} /> : null}
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  sections: {
    gap: 20,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  options: {
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  option: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
  },
  optionTextActive: {
    fontWeight: "700",
  },
}));
