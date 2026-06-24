import { Plus } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { PressableScale } from '@/components/shared/PressableScale';

type FabButtonProps = {
  onPress: () => void;
};

export function FabButton({ onPress }: FabButtonProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      scaleTo={0.91}
      style={styles.fab}>
      <Plus color="#FFFFFF" size={24} strokeWidth={2.5} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#1A3A2A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
});
