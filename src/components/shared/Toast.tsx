import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from '@/features/debts/store/appStore';

type ToastProps = {
  bottomOffset?: number;
};

export function Toast({ bottomOffset = 90 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const toast = useAppStore((s) => s.toast);

  useEffect(() => {
    return () => useAppStore.getState().clearToast();
  }, []);

  if (!toast) return null;

  return (
    <View pointerEvents="none" style={[styles.host, { bottom: bottomOffset + insets.bottom }]}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={styles.toast}>
        <Text style={styles.text}>{toast}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    backgroundColor: '#1A1A18',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    maxWidth: '90%',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
