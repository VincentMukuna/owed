import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Text } from './Text';

type FormFieldProps = {
  label: string;
  children: ReactNode;
  hint?: string;
};

export function FormField({ label, children, hint }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text variant="label" style={styles.label}>
        {label}
      </Text>
      {children}
      {hint ? (
        <Text variant="caption" muted style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  field: {
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.muted,
  },
  hint: {
    marginTop: theme.spacing.xs,
  },
}));
