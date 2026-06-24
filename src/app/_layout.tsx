import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Toast } from '@/components/shared/Toast';
import { useAppStore } from '@/features/debts/store/appStore';
import { queryClient } from '@/lib/api/queryClient';

export default function RootLayout() {
  useEffect(() => {
    useAppStore.getState().reset();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            contentStyle: { backgroundColor: '#F7F5F1' },
          }}>
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="add-debt" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="debt/[id]" options={{ animation: 'slide_from_right' }} />
        </Stack>
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
