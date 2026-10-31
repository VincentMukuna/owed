import {
  type ReactElement,
  type ReactNode,
  type RefObject,
  cloneElement,
  isValidElement,
  useRef,
  useState,
} from "react";

import {
  type ColorValue,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Platform,
  type PressableProps,
  StyleSheet as RNStyleSheet,
  View,
} from "react-native";

import {
  type MenuAction,
  type MenuComponentRef,
  MenuView,
  type NativeActionEvent,
} from "@expo/ui/community/menu";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import type { DebtCardView, DebtDetailView } from "@/features/debts/view-models";

export type DebtAction = "record-payment" | "mark-paid" | "edit-debt" | "archive-debt";

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
      title: "Add Payment",
      image: "plus.circle",
    });
    actions.push({
      id: "mark-paid",
      title: "Mark as Paid",
      image: "checkmark.circle",
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

type PressableChildProps = {
  onLongPress?: PressableProps["onLongPress"];
};

function AndroidMenuTrigger({
  children,
  menuRef,
}: {
  children: ReactNode;
  menuRef: RefObject<MenuComponentRef | null>;
}) {
  if (!isValidElement<PressableChildProps>(children) || typeof children.type === "string") {
    return children;
  }

  const pressableChild = children as ReactElement<PressableChildProps>;
  const existingOnLongPress = pressableChild.props.onLongPress;

  return cloneElement(pressableChild, {
    onLongPress: (event: GestureResponderEvent) => {
      menuRef.current?.show();
      existingOnLongPress?.(event);
    },
  });
}

export function DebtActionsMenu({
  debt,
  children,
  onAction,
  openOnLongPress = false,
}: DebtActionsMenuProps) {
  const { theme } = useUnistyles();
  const menuRef = useRef<MenuComponentRef>(null);
  const [triggerWidth, setTriggerWidth] = useState(0);

  const measureTrigger = (event: LayoutChangeEvent) => {
    setTriggerWidth(event.nativeEvent.layout.width);
  };

  const handlePressAction = (event: NativeActionEvent) => {
    const action = event.nativeEvent.event as DebtAction;

    if (
      action === "record-payment" ||
      action === "mark-paid" ||
      action === "edit-debt" ||
      action === "archive-debt"
    ) {
      onAction(action, debt);
    }
  };

  const actions = buildActions(debt, theme.colors.danger);

  // The detail-header action has its own fixed footprint. Only card triggers
  // participate in the full-width row measurement below.
  if (!openOnLongPress) {
    return (
      <MenuView
        actions={actions}
        onPressAction={handlePressAction}
        style={styles.menuButton}
        title={debt.name}
      >
        <View collapsable={false} style={styles.menuButton}>
          {children}
        </View>
      </MenuView>
    );
  }

  // Android MenuView wraps children in a Pressable for long-press menus, which
  // swallows taps before they reach the card's own press handler.
  if (Platform.OS === "android" && openOnLongPress) {
    return (
      <View collapsable={false} style={styles.menu}>
        <AndroidMenuTrigger menuRef={menuRef}>{children}</AndroidMenuTrigger>
        <View pointerEvents="none" style={styles.menuAnchorLayer}>
          <MenuView
            ref={menuRef}
            actions={actions}
            onPressAction={handlePressAction}
            shouldOpenOnLongPress={false}
            style={styles.menuAnchorHost}
            title={debt.name}
          >
            <View style={styles.menuAnchor} />
          </MenuView>
        </View>
      </View>
    );
  }

  return (
    <View onLayout={measureTrigger} style={styles.menu}>
      <MenuView
        actions={actions}
        onPressAction={handlePressAction}
        shouldOpenOnLongPress={openOnLongPress}
        style={styles.menu}
        title={debt.name}
      >
        {/* SwiftUI measures this subtree independently of the outer Yoga row.
            Give its flex children a concrete width instead of an intrinsic proposal. */}
        <View collapsable={false} style={triggerWidth > 0 ? { width: triggerWidth } : undefined}>
          {children}
        </View>
      </MenuView>
    </View>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    width: 36,
    height: 36,
  },
  menu: {
    width: "100%",
    flexShrink: 0,
    position: "relative",
  },
  menuAnchorLayer: {
    ...RNStyleSheet.absoluteFill,
  },
  menuAnchorHost: {
    flex: 1,
  },
  menuAnchor: {
    flex: 1,
  },
});
