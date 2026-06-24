import type { ReactNode } from "react";

import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

type TextVariant =
  | "hero"
  | "title"
  | "subtitle"
  | "body"
  | "caption"
  | "label"
  | "amount"
  | "amountSm"
  | "muted";

type TextProps = RNTextProps & {
  children: ReactNode;
  variant?: TextVariant;
  muted?: boolean;
};

export function Text({ children, variant = "body", muted = false, style, ...props }: TextProps) {
  const { theme } = useUnistyles();
  const variantStyle = theme.typography[variant === "muted" ? "body" : variant] as TextStyle;

  return (
    <RNText
      style={[
        styles.base,
        variantStyle,
        muted || variant === "muted" ? { color: theme.colors.muted } : { color: theme.colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create(() => ({
  base: {},
}));
