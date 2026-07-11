import type { ReactNode } from "react";

import { type ColorValue, View } from "react-native";

import { type MenuAction, MenuView, type NativeActionEvent } from "@expo/ui/community/menu";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export type NotificationsAction = "refresh" | "clear-inbox";

type NotificationsActionsMenuProps = {
  canClearInbox: boolean;
  children: ReactNode;
  onAction: (action: NotificationsAction) => void;
};

function buildActions(canClearInbox: boolean, dangerColor: ColorValue): MenuAction[] {
  return [
    {
      id: "refresh",
      title: "Refresh",
      image: "arrow.clockwise",
    },
    {
      id: "clear-inbox",
      title: "Clear Inbox",
      image: "archivebox",
      titleColor: dangerColor,
      imageColor: dangerColor,
      attributes: {
        destructive: true,
        disabled: !canClearInbox,
      },
    },
  ];
}

export function NotificationsActionsMenu({
  canClearInbox,
  children,
  onAction,
}: NotificationsActionsMenuProps) {
  const { theme } = useUnistyles();

  const handlePressAction = (event: NativeActionEvent) => {
    const action = event.nativeEvent.event as NotificationsAction;

    if (action === "refresh" || action === "clear-inbox") {
      onAction(action);
    }
  };

  return (
    <MenuView
      actions={buildActions(canClearInbox, theme.colors.danger)}
      onPressAction={handlePressAction}
      style={styles.menu}
      title="Notifications"
    >
      <View collapsable={false}>{children}</View>
    </MenuView>
  );
}

const styles = StyleSheet.create({
  menu: {
    flexShrink: 0,
  },
});
