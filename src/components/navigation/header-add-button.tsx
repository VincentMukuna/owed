import { Pressable, StyleSheet } from "react-native";

import { router } from "expo-router";

import { Plus } from "lucide-react-native";

import { lightImpact } from "@/lib/haptics";
import { HEADER_TINT } from "@/lib/navigation/stack-options";

export function HeaderAddButton() {
  return (
    <Pressable
      accessibilityLabel="Add debt"
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => {
        lightImpact();
        router.push("/add-debt");
      }}
      style={styles.button}
    >
      <Plus color={HEADER_TINT} size={22} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
