import { forwardRef, useCallback, useRef } from "react";

import {
  type StyleProp,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

import { UserPlus } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { PressableScale } from "@/components/shared/pressable-scale";

import { ContactPickerSheet, type ContactPickerSheetRef } from "./contact-picker-sheet";

type ContactPhoneInputProps = Omit<TextInputProps, "onChangeText" | "style" | "value"> & {
  value: string;
  onChangeText: (value: string) => void;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  contactButtonStyle?: StyleProp<ViewStyle>;
};

export const ContactPhoneInput = forwardRef<TextInput, ContactPhoneInputProps>(
  ({ value, onChangeText, style, containerStyle, contactButtonStyle, ...inputProps }, ref) => {
    const { theme } = useUnistyles();
    const pickerRef = useRef<ContactPickerSheetRef>(null);

    const openPicker = useCallback(() => {
      pickerRef.current?.present();
    }, []);

    return (
      <>
        <View style={[styles.container, containerStyle]}>
          <TextInput
            {...inputProps}
            ref={ref}
            autoCapitalize="none"
            keyboardType="phone-pad"
            onChangeText={onChangeText}
            style={[styles.input, style]}
            value={value}
          />
          {process.env.EXPO_OS !== "web" ? (
            <PressableScale
              accessibilityHint="Search your phone contacts"
              accessibilityLabel="Choose phone number from contacts"
              accessibilityRole="button"
              hitSlop={8}
              onPress={openPicker}
              style={[styles.contactButton, contactButtonStyle]}
            >
              <UserPlus color={theme.colors.icon} size={19} strokeWidth={1.9} />
            </PressableScale>
          ) : null}
        </View>
        <ContactPickerSheet ref={pickerRef} onSelectPhone={onChangeText} />
      </>
    );
  },
);

ContactPhoneInput.displayName = "ContactPhoneInput";

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
}));
