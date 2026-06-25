import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { type Href, router, useNavigation } from "expo-router";

import { HeaderSaveButton } from "@/components/navigation/header-save-button";

import { useAddPerson } from "../hooks/use-add-person";

export function AddPersonScreen() {
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
          placeholderTextColor="#C8C8C0"
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
          placeholderTextColor="#C8C8C0"
          style={styles.input}
          value={phone}
        />
      </Field>

      <Field label="Notes">
        <TextInput
          multiline
          onChangeText={setNotes}
          placeholder="Optional — what this is about, context, etc."
          placeholderTextColor="#C8C8C0"
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
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A8A82",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#1A1A18",
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
});
