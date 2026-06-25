import { TextInput, type TextInputProps, View } from "react-native";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Text } from "./text";

type InputProps = TextInputProps & {
  label?: string;
  prefix?: string;
  large?: boolean;
};

export function Input({ label, prefix, large, style, ...props }: InputProps) {
  const { theme } = useUnistyles();

  styles.useVariants({ large: large ?? false });

  return (
    <View>
      {label ? (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View style={styles.inputWrap}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={theme.colors.placeholder}
          style={[styles.input, style]}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  label: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.muted,
  },
  inputWrap: {
    position: "relative",
    justifyContent: "center",
  },
  prefix: {
    position: "absolute",
    left: theme.spacing.md,
    zIndex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.muted,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontSize: 14,
    color: theme.colors.text,

    variants: {
      large: {
        true: {
          paddingLeft: 60,
          paddingVertical: theme.spacing.md,
          fontSize: 24,
          fontWeight: "700",
          fontVariant: ["tabular-nums"],
        },
        false: {},
      },
    },
  },
}));
