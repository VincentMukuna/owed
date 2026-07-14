import {
  type ComponentType,
  type ReactNode,
  forwardRef,
  useCallback,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { AppState, Linking, Platform, Text, type TextInput, View } from "react-native";

import { Contact, ContactField, getPermissionsAsync, requestPermissionsAsync } from "expo-contacts";

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetTextInput,
  useBottomSheetScrollableCreator,
} from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { Search, UserRound } from "lucide-react-native";
import { FullWindowOverlay } from "react-native-screens";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { selectionChange } from "@/lib/haptics";
import { getInitials } from "@/lib/utils/formatters";

import {
  type ContactPhoneView,
  filterContactPhoneViews,
  toContactPhoneViews,
} from "../lib/contact-phone-utils";

const CONTACT_PHONE_FIELDS = [ContactField.FULL_NAME, ContactField.PHONES] as const;

const SHEET_CONTAINER = (Platform.OS === "ios" ? FullWindowOverlay : undefined) as
  | ComponentType<{ children?: ReactNode }>
  | undefined;

type PickerState = "idle" | "loading" | "ready" | "denied" | "error";

export type ContactPickerSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type ContactPickerSheetProps = {
  initialSearchQuery?: string;
  onSelectPhone: (number: string) => void;
};

type ContactPhoneRowView = {
  id: string;
  name: string;
  number: string;
};

export const ContactPickerSheet = forwardRef<ContactPickerSheetRef, ContactPickerSheetProps>(
  ({ initialSearchQuery = "", onSelectPhone }, ref) => {
    const { theme } = useUnistyles();
    const sheetRef = useRef<BottomSheetModal>(null);
    const inputRef = useRef<TextInput>(null);
    const [state, setState] = useState<PickerState>("idle");
    const [contacts, setContacts] = useState<ContactPhoneView[]>([]);
    const [query, setQuery] = useState("");
    const snapPoints = useMemo(() => ["90%"], []);
    const renderScrollComponent = useBottomSheetScrollableCreator();

    const loadContacts = useCallback(async () => {
      setState("loading");
      try {
        const details = await Contact.getAllDetails(CONTACT_PHONE_FIELDS);
        setContacts(toContactPhoneViews(details));
        setState("ready");
      } catch (error) {
        if (__DEV__) {
          console.error("[ContactPickerSheet] failed to load contacts", error);
        }
        setState("error");
      }
    }, []);

    const present = useCallback(async () => {
      if (process.env.EXPO_OS === "web") return;

      setQuery(initialSearchQuery.trim());

      try {
        let permission = await getPermissionsAsync();
        if (permission.status === "undetermined") {
          permission = await requestPermissionsAsync();
        }

        sheetRef.current?.present();
        if (permission.granted) {
          await loadContacts();
        } else {
          setState("denied");
        }
      } catch (error) {
        if (__DEV__) {
          console.error("[ContactPickerSheet] failed to request contact access", error);
        }
        sheetRef.current?.present();
        setState("error");
      }
    }, [initialSearchQuery, loadContacts]);

    useImperativeHandle(
      ref,
      () => ({
        present: () => void present(),
        dismiss: () => sheetRef.current?.dismiss(),
      }),
      [present],
    );

    const deferredQuery = useDeferredValue(query);
    const visibleContacts = useMemo(
      () => filterContactPhoneViews(contacts, deferredQuery),
      [contacts, deferredQuery],
    );
    const visiblePhoneRows = useMemo(() => {
      const rows: ContactPhoneRowView[] = [];

      for (const contact of visibleContacts) {
        for (const phone of contact.phones) {
          rows.push({
            id: `${contact.id}:${phone.id}`,
            name: contact.name,
            number: phone.number,
          });
        }
      }

      return rows;
    }, [visibleContacts]);

    useEffect(() => {
      if (state !== "denied") return;

      const subscription = AppState.addEventListener("change", (nextState) => {
        if (nextState !== "active") return;

        void getPermissionsAsync()
          .then((permission) => {
            if (permission.granted) {
              return loadContacts();
            }
          })
          .catch((error) => {
            if (__DEV__) {
              console.error("[ContactPickerSheet] failed to refresh contact access", error);
            }
          });
      });

      return () => subscription.remove();
    }, [loadContacts, state]);

    useEffect(() => {
      if (state !== "ready") return;

      const frame = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }, [state]);

    const selectPhone = useCallback(
      (number: string) => {
        selectionChange();
        onSelectPhone(number);
        sheetRef.current?.dismiss();
      },
      [onSelectPhone],
    );

    const handleSheetChange = useCallback(
      (index: number) => {
        if (index >= 0 && state === "ready") {
          requestAnimationFrame(() => inputRef.current?.focus());
        }
      },
      [state],
    );

    const handleDismiss = useCallback(() => {
      setQuery("");
      setState("idle");
    }, []);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      [],
    );

    const renderItem = useCallback(
      ({ item }: { item: ContactPhoneRowView }) => (
        <ContactPhoneRow row={item} onSelectPhone={selectPhone} />
      ),
      [selectPhone],
    );

    const keyExtractor = useCallback((item: ContactPhoneRowView) => item.id, []);

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        containerComponent={SHEET_CONTAINER}
        onChange={handleSheetChange}
        onDismiss={handleDismiss}
        handleIndicatorStyle={styles.handle}
        backgroundStyle={styles.sheetBackground}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Choose phone number</Text>
        </View>

        {state === "ready" ? (
          <>
            <View style={styles.searchWrap}>
              <Search color={theme.colors.muted} size={18} strokeWidth={1.75} />
              <BottomSheetTextInput
                ref={inputRef as never}
                autoCapitalize="words"
                autoCorrect={false}
                onChangeText={setQuery}
                placeholder="Search contacts"
                placeholderTextColor={theme.colors.placeholder}
                returnKeyType="search"
                style={styles.searchInput}
                value={query}
              />
            </View>
            <FlashList
              data={visiblePhoneRows}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              ListEmptyComponent={
                <SheetMessage
                  title={contacts.length === 0 ? "No contacts available" : "No contacts found"}
                  copy={
                    contacts.length === 0
                      ? "Contacts with phone numbers will appear here."
                      : "Try another name or phone number."
                  }
                />
              }
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              renderScrollComponent={renderScrollComponent}
            />
          </>
        ) : null}

        {state === "loading" || state === "idle" ? (
          <View style={styles.centeredState}>
            <LoadingSpinner />
          </View>
        ) : null}

        {state === "denied" ? (
          <SheetMessage
            title="Contacts access is off"
            copy="Allow contact access in Settings to choose a phone number."
            actionLabel="Open Settings"
            onAction={() => void Linking.openSettings()}
          />
        ) : null}

        {state === "error" ? (
          <SheetMessage
            title="Contacts could not be loaded"
            copy="Try again in a moment."
            actionLabel="Try again"
            onAction={() => void loadContacts()}
          />
        ) : null}
      </BottomSheetModal>
    );
  },
);

ContactPickerSheet.displayName = "ContactPickerSheet";

function ContactPhoneRow({
  row,
  onSelectPhone,
}: {
  row: ContactPhoneRowView;
  onSelectPhone: (number: string) => void;
}) {
  return (
    <PressableScale
      accessibilityLabel={`Use phone number ${row.number} for ${row.name}`}
      accessibilityRole="button"
      onPress={() => onSelectPhone(row.number)}
      style={styles.contactRow}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(row.name)}</Text>
      </View>
      <View style={styles.contactBody}>
        <Text numberOfLines={1} style={styles.contactName}>
          {row.name}
        </Text>
        <Text numberOfLines={1} style={styles.phoneNumber}>
          {row.number}
        </Text>
      </View>
    </PressableScale>
  );
}

function SheetMessage({
  title,
  copy,
  actionLabel,
  onAction,
}: {
  title: string;
  copy: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.messageState}>
      <View style={styles.messageIcon}>
        <UserRound color={theme.colors.mutedLight} size={21} strokeWidth={1.6} />
      </View>
      <Text style={styles.messageTitle}>{title}</Text>
      <Text style={styles.messageCopy}>{copy}</Text>
      {actionLabel && onAction ? (
        <PressableScale onPress={onAction} style={styles.messageAction}>
          <Text style={styles.messageActionText}>{actionLabel}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  sheetBackground: { backgroundColor: theme.colors.sheet },
  handle: { backgroundColor: theme.colors.sheetHandle, width: 36 },
  headerRow: { paddingHorizontal: 20, paddingBottom: 4 },
  title: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 16, color: theme.colors.text, padding: 0 },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  centeredState: { flex: 1, alignItems: "center", justifyContent: "center" },
  contactRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.personNeutralBg,
  },
  avatarText: { fontSize: 14, fontWeight: "700", color: theme.colors.personNeutralText },
  contactBody: { flex: 1, minWidth: 0, gap: 2 },
  contactName: { fontSize: 15, fontWeight: "600", color: theme.colors.text, lineHeight: 20 },
  phoneNumber: {
    fontSize: 14,
    color: theme.colors.muted,
    fontVariant: ["tabular-nums"],
  },
  messageState: { alignItems: "center", paddingHorizontal: 28, paddingTop: 56 },
  messageIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
  },
  messageTitle: { fontSize: 15, fontWeight: "600", color: theme.colors.text },
  messageCopy: {
    maxWidth: 260,
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 20,
    textAlign: "center",
  },
  messageAction: {
    marginTop: 18,
    minHeight: 42,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  messageActionText: { fontSize: 14, fontWeight: "700", color: theme.colors.primaryForeground },
}));
