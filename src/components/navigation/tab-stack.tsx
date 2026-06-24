import { Stack } from "expo-router";

import { TAB_STACK_SCREEN_OPTIONS } from "@/lib/navigation/stack-options";

export function TabStack() {
  return <Stack screenOptions={TAB_STACK_SCREEN_OPTIONS} />;
}
