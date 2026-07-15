import { useEffect, useState } from "react";

import { Pressable, ScrollView, Text, View } from "react-native";

import { Stack } from "expo-router";

import { ChevronDown, MessageSquareText } from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { ListInsetDivider } from "@/components/shared/list-inset-divider";
import {
  SettingsCard,
  SettingsIconTile,
  SettingsNavRow,
  SettingsSection,
} from "@/features/settings/components/settings-ui";
import { useGetHelpActions } from "@/features/settings/hooks/use-get-help-actions";
import { selectionChange } from "@/lib/haptics";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-owwed",
    question: "What is Owwed?",
    answer:
      "Owwed helps you remember informal debts between you and other people.\n\nTrack both:\n- Money people owe you\n- Money you owe others\n\nEverything stays private on your device.",
  },
  {
    id: "account",
    question: "Does Owwed require an account?",
    answer: "No.\n\nOwwed works without creating an account.\n\nYour data stays on your device.",
  },
  {
    id: "uploads",
    question: "Does Owwed upload my data?",
    answer:
      "No.\n\nYour debts, people, and payments stay on your device by default.\n\nThe only information Owwed receives is optional feedback you choose to send.",
  },
  {
    id: "backup",
    question: "Can I back up my data?",
    answer:
      "Yes.\n\nUse Settings > Backup Data to create a backup you can restore later or move to another device.",
  },
  {
    id: "owe-someone",
    question: "Can I track money I owe someone?",
    answer:
      "Yes.\n\nEach record can be either:\n- They owe me\n- I owe them\n\nThis keeps everything in one place.",
  },
  {
    id: "partial-payments",
    question: "Can I record partial payments?",
    answer: "Yes.\n\nYou can record multiple payments until the debt is fully settled.",
  },
  {
    id: "fully-paid",
    question: "What happens when a debt is fully paid?",
    answer: "Owwed automatically marks it as settled while preserving the payment history.",
  },
  {
    id: "reminders",
    question: "How are reminders calculated?",
    answer: "Reminders are based on the due date you choose when creating a record.",
  },
  {
    id: "free",
    question: "Is Owwed free?",
    answer:
      "Yes.\n\nOwwed is free to use, with no subscriptions and no ads.\n\nIt's also open source.",
  },
  {
    id: "name",
    question: "Why is the app called Owwed?",
    answer:
      'The extra "w" is intentional.\n\nIt gives the app a unique identity while still reflecting the idea of remembering what is owed.',
  },
];

const CONTACT_ICON_SIZE = 16;

export function HelpCenterScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);
  const { handleShareFeedbackPress } = useGetHelpActions();

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "Help Center" }} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.faqList}>
          {FAQ_ITEMS.map((item, index) => (
            <FaqRow
              expanded={expandedId === item.id}
              item={item}
              key={item.id}
              onPress={() => {
                selectionChange();
                setExpandedId((current) => (current === item.id ? null : item.id));
              }}
              showDivider={index > 0}
            />
          ))}
        </View>

        <SettingsSection title="Still have a question?">
          <Text style={styles.contactBody}>
            {"I'd love to hear your feedback or feature ideas."}
          </Text>
          <SettingsCard>
            <SettingsNavRow
              label="Send Feedback"
              leading={
                <SettingsIconTile backgroundColor="#DC2626">
                  <MessageSquareText color="#FFFFFF" size={CONTACT_ICON_SIZE} strokeWidth={2.2} />
                </SettingsIconTile>
              }
              onPress={() => handleShareFeedbackPress("feedback")}
            />
            <SettingsNavRow
              bordered
              label="Report a Bug"
              leading={
                <SettingsIconTile backgroundColor="#F97316">
                  <MessageSquareText color="#FFFFFF" size={CONTACT_ICON_SIZE} strokeWidth={2.2} />
                </SettingsIconTile>
              }
              onPress={() => handleShareFeedbackPress("bug")}
            />
            <SettingsNavRow
              bordered
              label="Request a Feature"
              leading={
                <SettingsIconTile backgroundColor="#2563EB">
                  <MessageSquareText color="#FFFFFF" size={CONTACT_ICON_SIZE} strokeWidth={2.2} />
                </SettingsIconTile>
              }
              onPress={() => handleShareFeedbackPress("feature_request")}
            />
          </SettingsCard>
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

function FaqRow({
  expanded,
  item,
  onPress,
  showDivider,
}: {
  expanded: boolean;
  item: FaqItem;
  onPress: () => void;
  showDivider: boolean;
}) {
  const { theme } = useUnistyles();
  const progress = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, { duration: 180 });
  }, [expanded, progress]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));

  return (
    <Animated.View layout={LinearTransition.duration(180)}>
      {showDivider ? <ListInsetDivider /> : null}
      <Pressable
        accessibilityHint={expanded ? "Collapses this answer" : "Expands this answer"}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onPress}
        style={styles.faqPressable}
      >
        <Text style={styles.question}>{item.question}</Text>
        <Animated.View style={chevronStyle}>
          <ChevronDown color={theme.colors.iconMuted} size={18} strokeWidth={2.2} />
        </Animated.View>
      </Pressable>

      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(120)}
          layout={LinearTransition.duration(180)}
          style={styles.answerWrap}
        >
          <Text style={styles.answer}>{item.answer}</Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
    gap: 22,
  },
  faqList: {
    marginTop: -8,
  },
  faqPressable: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
  },
  question: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: theme.colors.text,
  },
  answerWrap: {
    paddingBottom: 18,
    paddingRight: 34,
  },
  answer: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.muted,
  },
  contactBody: {
    marginTop: -2,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.muted,
  },
}));
