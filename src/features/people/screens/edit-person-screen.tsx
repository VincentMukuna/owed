import { useCallback, useLayoutEffect, useState } from "react";

import { ScrollView, Text, TextInput, View } from "react-native";

import { router, useNavigation } from "expo-router";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { HeaderSaveButton } from "@/components/navigation/header-save-button";
import { FormScreenSkeleton } from "@/components/ui/screen-skeletons";

import { usePersonDetail } from "../hooks/use-person-detail";
import { useUpdatePerson } from "../hooks/use-update-person";

type EditPersonScreenProps = {
  personId: string;
};

export function EditPersonScreen({ personId }: EditPersonScreenProps) {
  const { theme } = useUnistyles();
  const navigation = useNavigation();
  const { data: person, isPending } = usePersonDetail(personId);
  const updatePerson = useUpdatePerson();

  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);

  // Hydrate fields from the loaded person once, without clobbering edits.
  const nameValue = name ?? person?.name ?? "";
  const phoneValue = phone ?? person?.phoneNumber ?? "";
  const notesValue = notes ?? person?.notes ?? "";

  const canSave = nameValue.trim().length > 0 && !updatePerson.isPending;

  const handleSave = useCallback(() => {
    if (!person || nameValue.trim().length === 0) {
      return;
    }

    updatePerson.mutate(
      {
        id: person.id,
        name: nameValue,
        phoneNumber: phoneValue,
        notes: notesValue,
      },
      {
        onSuccess: () => {
          if (router.canGoBack()) {
            router.back();
          }
        },
      },
    );
  }, [person, nameValue, phoneValue, notesValue, updatePerson]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderSaveButton
          disabled={!canSave}
          label={updatePerson.isPending ? "Saving…" : "Save"}
          onPress={handleSave}
        />
      ),
    });
  }, [canSave, handleSave, navigation, updatePerson.isPending]);

  if (isPending) {
    return <FormScreenSkeleton />;
  }

  if (!person) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>This person could not be found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.form}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Field label="Name">
        <TextInput
          autoCapitalize="words"
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={theme.colors.placeholder}
          style={styles.input}
          value={nameValue}
        />
      </Field>

      <Field label="Phone number">
        <TextInput
          autoCapitalize="none"
          keyboardType="phone-pad"
          onChangeText={setPhone}
          placeholder="Optional"
          placeholderTextColor={theme.colors.placeholder}
          style={styles.input}
          value={phoneValue}
        />
      </Field>

      <Field label="Notes">
        <TextInput
          multiline
          onChangeText={setNotes}
          placeholder="Optional. What this is about, context, etc."
          placeholderTextColor={theme.colors.placeholder}
          style={[styles.input, styles.notesInput]}
          value={notesValue}
        />
      </Field>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputCard}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  form: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
    gap: 18,
  },
  field: {
    gap: 8,
  },
  inputCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.name === "light" ? 0.025 : 0.05,
    shadowRadius: theme.name === "light" ? 1.5 : 2,
    elevation: theme.name === "light" ? 0 : 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  input: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    fontSize: 14,
    color: theme.colors.text,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  missingText: {
    fontSize: 16,
    color: theme.colors.muted,
  },
}));
