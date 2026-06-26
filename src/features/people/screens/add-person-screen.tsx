import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { ScrollView, Text, TextInput, View } from "react-native";

import { type Href, router, useNavigation } from "expo-router";

import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { HeaderSaveButton } from "@/components/navigation/header-save-button";

import { useAddPerson } from "../hooks/use-add-person";

export function AddPersonScreen() {
  const { theme } = useUnistyles();
  const navigation = useNavigation();
  const addPerson = useAddPerson();
  const nameRef = useRef<TextInput>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const canSave = name.trim().length > 0 && !addPerson.isPending;

  const handleSave = useCallback(() => {
    if (name.trim().length === 0) {
      return;
    }

    addPerson.mutate(
      { name, phoneNumber: phone, notes },
      {
        onSuccess: (person) => {
          // Land on the new person so the next step (adding a debt) is one tap away.
          router.replace(`/person/${person.id}` as Href);
        },
      },
    );
  }, [addPerson, name, phone, notes]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderSaveButton
          disabled={!canSave}
          label={addPerson.isPending ? "Saving…" : "Save"}
          onPress={handleSave}
        />
      ),
    });
  }, [addPerson.isPending, canSave, handleSave, navigation]);

  return (
    <ScrollView
      contentContainerStyle={styles.form}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Field label="Name">
        <TextInput
          ref={nameRef}
          autoCapitalize="words"
          autoFocus
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={theme.colors.placeholder}
          style={styles.input}
          value={name}
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
          value={phone}
        />
      </Field>

      <Field label="Notes">
        <TextInput
          multiline
          onChangeText={setNotes}
          placeholder="Optional. What this is about, context, etc."
          placeholderTextColor={theme.colors.placeholder}
          style={[styles.input, styles.notesInput]}
          value={notes}
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
}));
