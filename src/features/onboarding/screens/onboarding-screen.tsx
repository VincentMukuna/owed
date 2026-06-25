import { useEffect } from "react";

import { ScrollView, Text, View } from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { Wallet } from "lucide-react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { completeOnboarding } from "@/features/onboarding/lib/onboarding-storage";
import { useSettingsStore } from "@/features/settings/hooks/use-settings-store";
import { HOME_ROUTE } from "@/lib/navigation/routes";
import { formatCurrency } from "@/lib/utils/formatters";

function PreviewDebtCard() {
  const defaultCurrency = useSettingsStore((state) => state.defaultCurrency);

  return (
    <View style={styles.previewCard}>
      <View style={styles.previewRow}>
        <Avatar initials="BM" status="due-soon" />
        <View style={styles.previewBody}>
          <View style={styles.previewTop}>
            <View>
              <Text style={styles.previewName}>Brian Mwangi</Text>
              <Text style={styles.previewReason}>Transport + drinks</Text>
            </View>
            <Text style={styles.previewAmount}>{formatCurrency(3000, defaultCurrency)}</Text>
          </View>
          <View style={styles.previewFooter}>
            <Badge status="due-soon" />
            <Text style={styles.previewDue}>Due Friday</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function OnboardingScreen() {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const heroScale = useSharedValue(0.85);
  const heroOpacity = useSharedValue(0);

  useEffect(() => {
    heroScale.value = withTiming(1, { duration: 400 });
    heroOpacity.value = withTiming(1, { duration: 400 });
  }, [heroOpacity, heroScale]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: heroScale.value }],
  }));

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 160 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.hero, heroStyle]}>
          <View style={styles.logoWrap}>
            <Wallet color={theme.colors.primaryForeground} size={28} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>Never forget{"\n"}who owes you.</Text>
          <Text style={styles.subtitle}>
            Track amounts, promised dates, and payments, all in one private place.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.previewWrap}>
          <PreviewDebtCard />
        </Animated.View>

        <Text style={styles.privacy}>
          Your data stays on your device. Nothing is shared automatically.
        </Text>
      </ScrollView>

      <LinearGradient
        colors={theme.colors.footerGradient}
        style={[styles.footer, { paddingBottom: insets.bottom + 48 }]}
      >
        <PressableScale
          onPress={() => router.push({ pathname: "/add-debt", params: { from: "onboarding" } })}
          scaleTo={0.97}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Add first debt</Text>
        </PressableScale>
        <PressableScale
          onPress={async () => {
            await completeOnboarding();
            router.replace(HOME_ROUTE);
          }}
          style={styles.ghostBtn}
        >
          <Text style={styles.ghostBtnText}>Explore app</Text>
        </PressableScale>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 64,
  },
  hero: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
    lineHeight: 34,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 12,
    maxWidth: 260,
  },
  previewWrap: {
    width: "100%",
    maxWidth: 300,
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  previewRow: {
    flexDirection: "row",
    gap: 12,
  },
  previewBody: {
    flex: 1,
  },
  previewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  previewName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  previewReason: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  previewAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
  },
  previewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  previewDue: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  privacy: {
    fontSize: 11,
    color: theme.colors.mutedLight,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 240,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: {
    color: theme.colors.primaryForeground,
    fontSize: 15,
    fontWeight: "600",
  },
  ghostBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  ghostBtnText: {
    color: theme.colors.muted,
    fontSize: 14,
    fontWeight: "500",
  },
}));
