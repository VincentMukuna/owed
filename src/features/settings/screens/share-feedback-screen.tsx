import { useCallback, useLayoutEffect, useState } from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { router, useNavigation } from "expo-router";

import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import {
  KEYBOARD_DONE_ACCESSORY_ID,
  KeyboardDoneAccessory,
} from "@/components/ui/keyboard-done-accessory";
import { useUiStore } from "@/features/debts/store/ui-store";
import {
  type FeedbackCategory,
  feedbackCategories,
  submitProductFeedback,
} from "@/features/settings/lib/product-feedback";
import { lightImpact, selectionChange } from "@/lib/haptics";

const detailPlaceholders: Record<FeedbackCategory, string> = {
  bug: "What happened? What did you expect instead?",
  feature_request: "What would you like Owed to help you do?",
  feedback: "What should feel clearer, faster, or easier?",
};

export function ShareFeedbackScreen() {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const showToast = useUiStore((state) => state.showToast);

  const [category, setCategory] = useState<FeedbackCategory>("feedback");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !isSubmitting;

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          hitSlop={12}
          onPress={handleClose}
          style={styles.closeButton}
        >
          <X color={theme.colors.icon} size={18} strokeWidth={2} />
        </Pressable>
      ),
    });
  }, [handleClose, navigation, theme.colors.icon]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await submitProductFeedback({
        category,
        title,
        description,
        email,
      });
      lightImpact();
      showToast("Feedback sent. Thank you.");
      router.back();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not send feedback.");
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, category, description, email, showToast, title]);

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.root}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tabs}>
            {feedbackCategories.map((item) => {
              const active = category === item.value;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={item.value}
                  onPress={() => {
                    selectionChange();
                    setCategory(item.value);
                  }}
                  style={[styles.tab, active && styles.tabActive]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Field label="Subject" required>
            <TextInput
              autoCapitalize="sentences"
              onChangeText={setTitle}
              placeholder="Short summary"
              placeholderTextColor={theme.colors.placeholder}
              returnKeyType="next"
              style={styles.input}
              value={title}
            />
          </Field>

          <Field label="Details" required>
            <TextInput
              inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
              multiline
              onChangeText={setDescription}
              placeholder={detailPlaceholders[category]}
              placeholderTextColor={theme.colors.placeholder}
              style={[styles.input, styles.detailsInput]}
              textAlignVertical="top"
              value={description}
            />
          </Field>

          <Field label="Email (optional)">
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Where I can follow up"
              placeholderTextColor={theme.colors.placeholder}
              style={styles.input}
              value={email}
            />
          </Field>

          {error ? (
            <Text selectable style={styles.error}>
              {error}
            </Text>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 64, 72) }]}>
          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={() => {
              void handleSubmit();
            }}
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.colors.primaryForeground} />
            ) : (
              <Text style={styles.submitLabel}>Send feedback</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <KeyboardDoneAccessory />
    </>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={styles.inputCard}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  required: {
    color: theme.colors.danger,
  },
  inputCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  input: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    fontSize: 14,
    color: theme.colors.text,
  },
  detailsInput: {
    minHeight: 128,
  },
  tabs: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: theme.colors.surface,
    padding: 4,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
    overflow: "hidden",
  },
  tabActive: {
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
  },
  tabTextActive: {
    color: theme.colors.text,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.danger,
  },
  submitButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.primaryForeground,
  },
}));
