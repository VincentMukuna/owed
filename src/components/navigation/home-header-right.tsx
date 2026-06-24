import { StyleSheet, View } from "react-native";

import { Bell } from "lucide-react-native";

import { HeaderAddButton } from "@/components/navigation/header-add-button";
import { IconButton } from "@/components/shared/icon-button";

export function HomeHeaderRight() {
  return (
    <View style={styles.row}>
      <IconButton>
        <Bell color="#4A4A42" size={16} strokeWidth={1.5} />
      </IconButton>
      <HeaderAddButton />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
