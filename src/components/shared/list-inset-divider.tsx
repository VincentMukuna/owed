import type { ReactNode } from "react";

import { View } from "react-native";

import { StyleSheet } from "react-native-unistyles";

/** After a 40px avatar + 12px gap (DebtCard, PersonCard). */
export const LIST_LEADING_INSET_AVATAR_MD = 52;

/** After a 32px icon + 14px gap (ActivityRow, NotificationRow). */
export const LIST_LEADING_INSET_ICON_MD = 46;

type ListInsetDividerProps = {
  leadingInset?: number;
  trailingInset?: number;
};

export function ListInsetDivider({ leadingInset = 0, trailingInset = 0 }: ListInsetDividerProps) {
  return (
    <View
      style={[
        styles.divider,
        leadingInset > 0 ? { marginLeft: leadingInset } : null,
        trailingInset > 0 ? { marginRight: trailingInset } : null,
      ]}
    />
  );
}

type ListRowContainerProps = {
  children: ReactNode;
  showDivider?: boolean;
  leadingInset?: number;
  trailingInset?: number;
};

export function ListRowContainer({
  children,
  showDivider = false,
  leadingInset = 0,
  trailingInset = 0,
}: ListRowContainerProps) {
  return (
    <View>
      {showDivider ? (
        <ListInsetDivider leadingInset={leadingInset} trailingInset={trailingInset} />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.listDivider,
  },
}));
