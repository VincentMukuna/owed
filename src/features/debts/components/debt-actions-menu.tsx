import type { ReactNode } from "react";

import { type ColorValue, View } from "react-native";

import { type MenuAction, MenuView, type NativeActionEvent } from "@expo/ui/community/menu";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import type { DebtCardView, DebtDetailView } from "@/features/debts/view-models";

export type DebtAction = "record-payment" | "edit-debt" | "archive-debt";

type DebtActionsMenuProps = {
  debt: DebtCardView | DebtDetailView;
  children: ReactNode;
  onAction: (action: DebtAction, debt: DebtCardView | DebtDetailView) => void;
  openOnLongPress?: boolean;
};

function buildActions(debt: DebtCardView | DebtDetailView, dangerColor: ColorValue): MenuAction[] {
  const actions: MenuAction[] = [];

  if (debt.remaining > 0) {
    actions.push({
      id: "record-payment",
      title: "Record Payment",
      image: "plus.circle",
    });
  }

  actions.push({
    id: "edit-debt",
    title: "Edit Debt",
    image: "pencil",
  });

  actions.push({
    id: "archive-debt",
    title: "Archive Debt",
    image: "archivebox",
    titleColor: dangerColor,
    imageColor: dangerColor,
    attributes: { destructive: true },
  });

  return actions;
}

export function DebtActionsMenu({
  debt,
  children,
  onAction,
  openOnLongPress = false,
}: DebtActionsMenuProps) {
  const { theme } = useUnistyles();

  const handlePressAction = (event: NativeActionEvent) => {
    const action = event.nativeEvent.event as DebtAction;

    if (action === "record-payment" || action === "edit-debt" || action === "archive-debt") {
      onAction(action, debt);
    }
  };

  return (
    <MenuView
      actions={buildActions(debt, theme.colors.danger)}
      onPressAction={handlePressAction}
      shouldOpenOnLongPress={openOnLongPress}
      style={styles.menu}
      title={debt.name}
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
