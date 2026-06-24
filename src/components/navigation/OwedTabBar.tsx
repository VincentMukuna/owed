import { Activity, Home, List, Settings } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_CONFIG = {
  index: { label: 'Home', Icon: Home },
  debts: { label: 'Debts', Icon: List },
  activity: { label: 'Activity', Icon: Activity },
  settings: { label: 'Settings', Icon: Settings },
} as const;

export type TabBarProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  navigation: {
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault?: boolean;
    }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

export function OwedTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(30).stiffness(320)}
      exiting={FadeOutDown.duration(200)}
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 32) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG[route.name as keyof typeof TAB_CONFIG];
          if (!config) return null;

          const isFocused = state.index === index;
          const { Icon, label } = config;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tab}>
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <Icon
                  color={isFocused ? '#1A3A2A' : '#C0C0B8'}
                  size={20}
                  strokeWidth={isFocused ? 2.5 : 1.5}
                />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 1 }],
  },
  iconWrapActive: {
    transform: [{ scale: 1.1 }],
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C0C0B8',
  },
  labelActive: {
    color: '#1A3A2A',
  },
});
