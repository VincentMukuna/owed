import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type ButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onPress,
}: ButtonProps) {
  styles.useVariants({
    variant,
    size,
    fullWidth,
    disabled,
  });

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={styles.button}>
      <Text style={styles.label}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.lg,

    variants: {
      variant: {
        primary: {
          backgroundColor: theme.colors.primary,
        },
        secondary: {
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.borderStrong,
        },
        ghost: {
          backgroundColor: 'transparent',
        },
      },
      size: {
        sm: {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
        },
        md: {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
        },
        lg: {
          paddingVertical: theme.spacing.md + 2,
          paddingHorizontal: theme.spacing.xl,
        },
      },
      fullWidth: {
        true: {
          width: '100%',
        },
      },
      disabled: {
        true: {
          opacity: 0.4,
        },
      },
    },
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,

    variants: {
      variant: {
        primary: {
          color: theme.colors.primaryForeground,
        },
        secondary: {},
        ghost: {
          color: theme.colors.muted,
        },
      },
    },
  },
}));
