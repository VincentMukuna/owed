import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type StackProps = ViewProps & {
  children: ReactNode;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'column' | 'row';
};

export function Stack({
  children,
  gap = 'md',
  direction = 'column',
  style,
  ...props
}: StackProps) {
  styles.useVariants({ gap, direction });

  return (
    <View style={[styles.stack, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  stack: {
    variants: {
      direction: {
        column: {
          flexDirection: 'column',
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
        },
      },
      gap: {
        xs: { gap: theme.spacing.xs },
        sm: { gap: theme.spacing.sm },
        md: { gap: theme.spacing.md },
        lg: { gap: theme.spacing.lg },
        xl: { gap: theme.spacing.xl },
      },
    },
  },
}));
