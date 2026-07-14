import type { ReactNode } from "react";

import { Text, View } from "react-native";

import { ChevronRight } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { ListInsetDivider } from "@/components/shared/list-inset-divider";
import { PressableScale } from "@/components/shared/pressable-scale";

const ICON_COLUMN_WIDTH = 28;
const ROW_HORIZONTAL_PADDING = 16;

type SettingsIconTileProps = {
  children: ReactNode;
  backgroundColor?: string;
};

export function SettingsIconTile({ children, backgroundColor = "#2F7DFF" }: SettingsIconTileProps) {
  return (
    <View style={[styles.iconTile, { backgroundColor }]}>
      <View style={styles.iconTileHighlight} />
      <View style={styles.iconTileContent}>{children}</View>
    </View>
  );
}

type SettingsSectionProps = {
  title?: string;
  children: ReactNode;
};

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

type SettingsCardProps = {
  children: ReactNode;
};

export function SettingsCard({ children }: SettingsCardProps) {
  return <View style={styles.card}>{children}</View>;
}

type SettingsRowShellProps = {
  icon?: string;
  leading?: ReactNode;
  bordered?: boolean;
  children: ReactNode;
};

function SettingsRowShell({ icon, leading, bordered = false, children }: SettingsRowShellProps) {
  const iconContent =
    leading ??
    (icon ? (
      <SettingsIconTile backgroundColor="#6366F1">
        <Text style={styles.icon}>{icon}</Text>
      </SettingsIconTile>
    ) : null);

  return (
    <View style={styles.row}>
      {iconContent ? <View style={styles.iconColumn}>{iconContent}</View> : null}
      <View style={styles.rowBody}>
        {bordered ? <ListInsetDivider trailingInset={ROW_HORIZONTAL_PADDING} /> : null}
        <View style={styles.rowBodyContent}>{children}</View>
      </View>
    </View>
  );
}

type SettingsNavRowProps = {
  icon?: string;
  leading?: ReactNode;
  label: string;
  value?: string;
  showsChevron?: boolean;
  disabled?: boolean;
  bordered?: boolean;
  danger?: boolean;
  busyLabel?: string;
  onPress: () => void;
};

export function SettingsNavRow({
  icon,
  leading,
  label,
  value,
  showsChevron = true,
  disabled = false,
  bordered = false,
  danger = false,
  busyLabel,
  onPress,
}: SettingsNavRowProps) {
  const { theme } = useUnistyles();

  return (
    <PressableScale
      disabled={disabled}
      onPress={onPress}
      style={[styles.pressableRow, disabled && styles.rowDisabled]}
    >
      <SettingsRowShell bordered={bordered} icon={icon} leading={leading}>
        <View style={styles.rowContent}>
          <Text numberOfLines={1} style={[styles.label, danger && styles.dangerLabel]}>
            {label}
          </Text>
          <View style={styles.valueWrap}>
            {busyLabel ? (
              <Text numberOfLines={1} style={[styles.value, danger && styles.dangerValue]}>
                {busyLabel}
              </Text>
            ) : value ? (
              <Text numberOfLines={1} style={[styles.value, danger && styles.dangerValue]}>
                {value}
              </Text>
            ) : null}
            {busyLabel || !showsChevron ? null : (
              <ChevronRight color={theme.colors.iconMuted} size={16} strokeWidth={2} />
            )}
          </View>
        </View>
      </SettingsRowShell>
    </PressableScale>
  );
}

type SettingsDetailRowProps = {
  icon?: string;
  leading?: ReactNode;
  label: string;
  description?: string;
  value?: string;
  bordered?: boolean;
  onPress?: () => void;
  trailing?: ReactNode;
};

export function SettingsDetailRow({
  icon,
  leading,
  label,
  description,
  value,
  bordered = false,
  onPress,
  trailing,
}: SettingsDetailRowProps) {
  const { theme } = useUnistyles();

  const content = (
    <SettingsRowShell bordered={bordered} icon={icon} leading={leading}>
      <View style={styles.rowContent}>
        <View style={styles.detailCopy}>
          <Text numberOfLines={1} style={styles.label}>
            {label}
          </Text>
          {description ? (
            <Text numberOfLines={2} style={styles.description}>
              {description}
            </Text>
          ) : null}
        </View>
        {trailing ?? (
          <View style={styles.valueWrap}>
            {value ? (
              <Text numberOfLines={1} style={styles.value}>
                {value}
              </Text>
            ) : null}
            {onPress ? (
              <ChevronRight color={theme.colors.iconMuted} size={16} strokeWidth={2} />
            ) : null}
          </View>
        )}
      </View>
    </SettingsRowShell>
  );

  if (!onPress) {
    return content;
  }

  return (
    <PressableScale onPress={onPress} style={styles.pressableRow}>
      {content}
    </PressableScale>
  );
}

type SettingsTrailingRowProps = {
  bordered?: boolean;
  label: string;
  trailing: ReactNode;
};

export function SettingsTrailingRow({
  bordered = false,
  label,
  trailing,
}: SettingsTrailingRowProps) {
  return (
    <SettingsRowShell bordered={bordered}>
      <View style={styles.rowContent}>
        <Text numberOfLines={1} style={styles.label}>
          {label}
        </Text>
        <View style={styles.trailingControl}>{trailing}</View>
      </View>
    </SettingsRowShell>
  );
}

type SettingsHelperTextProps = {
  children: ReactNode;
};

export function SettingsHelperText({ children }: SettingsHelperTextProps) {
  return <Text style={styles.helper}>{children}</Text>;
}

type SettingsFooterTextProps = {
  children: ReactNode;
};

export function SettingsFooterText({ children }: SettingsFooterTextProps) {
  return <Text style={styles.footer}>{children}</Text>;
}

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.name === "light" ? theme.colors.borderStrong : theme.colors.border,
    overflow: "hidden",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingLeft: ROW_HORIZONTAL_PADDING,
  },
  pressableRow: {
    alignSelf: "stretch",
  },
  rowDisabled: {
    opacity: 0.6,
  },
  iconColumn: {
    width: ICON_COLUMN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginRight: 12,
  },
  icon: {
    fontSize: 15,
    lineHeight: 18,
    textAlign: "center",
  },
  iconTile: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.name === "dark" ? 0.16 : 0,
    shadowRadius: theme.name === "dark" ? 8 : 0,
    elevation: theme.name === "dark" ? 3 : 0,
  },
  iconTileHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.24)",
  },
  iconTileContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  rowBodyContent: {
    paddingRight: ROW_HORIZONTAL_PADDING,
    paddingVertical: 14,
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.muted,
  },
  valueWrap: {
    flexShrink: 1,
    maxWidth: "42%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  value: {
    flexShrink: 1,
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: "right",
  },
  trailingControl: {
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  dangerLabel: {
    color: theme.colors.danger,
  },
  dangerValue: {
    color: theme.colors.danger,
  },
  helper: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.muted,
  },
  footer: {
    fontSize: 12,
    color: theme.colors.muted,
    textAlign: "center",
    paddingTop: 4,
  },
}));

export const settingsUiStyles = styles;
