import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create((theme) => ({
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    width: '100%',
  },
}));
