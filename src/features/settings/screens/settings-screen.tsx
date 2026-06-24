import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Stack } from "expo-router";

import { ChevronRight } from "lucide-react-native";

import { APP_BACKGROUND } from "@/lib/navigation/stack-options";

const SECTIONS = [
  {
    title: "Preferences",
    items: [
      { label: "Default currency", value: "KES", icon: "💱" },
      { label: "Default reminder time", value: "9:00 AM", icon: "⏰" },
      { label: "Notifications", value: "Allowed", icon: "🔔" },
    ],
  },
  {
    title: "Privacy",
    items: [
      { label: "App lock", value: "Off", icon: "🔒" },
      { label: "Export data", value: "CSV", icon: "📤" },
    ],
  },
  {
    title: "About",
    items: [
      { label: "App version", value: "1.0.0", icon: "ℹ️" },
      { label: "Send feedback", value: "", icon: "💬" },
    ],
  },
];

export function SettingsScreen() {
  return (
    <>
      <Stack.Title large>Settings</Stack.Title>
      <View collapsable={false} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.card}>
                {section.items.map((item, index) => (
                  <View key={item.label} style={[styles.row, index > 0 && styles.rowBorder]}>
                    <Text style={styles.icon}>{item.icon}</Text>
                    <Text style={styles.label}>{item.label}</Text>
                    <View style={styles.valueWrap}>
                      {item.value ? <Text style={styles.value}>{item.value}</Text> : null}
                      <ChevronRight color="#D8D8D0" size={16} strokeWidth={2} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A8A82",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  icon: {
    fontSize: 16,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A18",
  },
  valueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  value: {
    fontSize: 14,
    color: "#8A8A82",
  },
});
