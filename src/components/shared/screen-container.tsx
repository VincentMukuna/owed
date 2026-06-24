import { View, type ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type ScreenContainerProps = ViewProps & {
  padded?: boolean;
};

export function ScreenContainer({ children, style, padded = true, ...props }: ScreenContainerProps) {
  return (
    <View style={[styles.container, padded && styles.padded, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  padded: {
    paddingHorizontal: 20,
  },
}));
