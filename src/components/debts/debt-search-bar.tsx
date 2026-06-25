import { forwardRef, memo, useCallback, useImperativeHandle, useRef } from "react";

import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInput as TextInputType,
  View,
} from "react-native";

import { Search, X } from "lucide-react-native";

type DebtSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  variant?: "default" | "header";
};

export type DebtSearchBarRef = {
  focus: () => void;
};

const DebtSearchBarInner = forwardRef<DebtSearchBarRef, DebtSearchBarProps>(
  ({ value, onChangeText, variant = "default" }, ref) => {
    const inputRef = useRef<TextInputType>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    const clear = useCallback(() => {
      onChangeText("");
    }, [onChangeText]);

    return (
      <View style={[styles.wrap, variant === "header" && styles.wrapHeader]}>
        <Search color="#8A8A82" size={16} strokeWidth={2} />
        <TextInput
          ref={inputRef}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
          onChangeText={onChangeText}
          placeholder="Search by name or reason"
          placeholderTextColor="#B8B8B0"
          returnKeyType="search"
          style={styles.input}
          value={value}
        />
        {value.length > 0 ? (
          <Pressable
            accessibilityLabel="Clear search"
            hitSlop={8}
            onPress={clear}
            style={styles.clear}
          >
            <X color="#8A8A82" size={14} strokeWidth={2.5} />
          </Pressable>
        ) : null}
      </View>
    );
  },
);

DebtSearchBarInner.displayName = "DebtSearchBar";

export const DebtSearchBar = memo(DebtSearchBarInner);

DebtSearchBar.displayName = "DebtSearchBar";

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFEFEC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  wrapHeader: {
    flex: 1,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A18",
    padding: 0,
  },
  clear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E0E0DA",
    alignItems: "center",
    justifyContent: "center",
  },
});
