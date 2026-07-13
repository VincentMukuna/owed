import type { ReactNode } from "react";

import {
  Button,
  HStack,
  Host,
  Image,
  Label,
  List,
  Section,
  Spacer,
  Text,
  Toggle,
  VStack,
  ZStack,
} from "@expo/ui/swift-ui";
import {
  background,
  buttonStyle,
  clipShape,
  contentShape,
  disabled,
  font,
  foregroundStyle,
  frame,
  kerning,
  listRowBackground,
  listStyle,
  scrollContentBackground,
  shadow,
  shapes,
  textCase,
} from "@expo/ui/swift-ui/modifiers";
import { useUnistyles } from "react-native-unistyles";
import type { SFSymbol } from "sf-symbols-typescript";

const rowHitArea = contentShape(shapes.rectangle());

export function useSettingsSwiftTheme() {
  const { theme } = useUnistyles();

  return {
    theme,
    listModifiers: [
      listStyle("insetGrouped"),
      scrollContentBackground("hidden"),
      background(theme.colors.background),
    ],
    rowBackground: listRowBackground(theme.colors.card),
    rowTitleModifiers: [font({ size: 14, weight: "medium" }), foregroundStyle(theme.colors.text)],
    rowValueModifiers: [font({ size: 14, weight: "regular" }), foregroundStyle(theme.colors.muted)],
    rowDescriptionModifiers: [
      font({ size: 12, weight: "regular" }),
      foregroundStyle(theme.colors.muted),
    ],
    sectionHeaderModifiers: [
      font({ size: 11, weight: "bold" }),
      foregroundStyle(theme.colors.muted),
      kerning(1.6),
      textCase("uppercase"),
    ],
    footerModifiers: [font({ size: 12, weight: "regular" }), foregroundStyle(theme.colors.muted)],
  };
}

function footerText(
  footer: ReactNode,
  modifiers: ReturnType<typeof useSettingsSwiftTheme>["footerModifiers"],
) {
  if (typeof footer === "string") {
    return <Text modifiers={modifiers}>{footer}</Text>;
  }

  return footer;
}

type SettingsSwiftListProps = {
  children: ReactNode;
  bottomInset?: number;
};

export function SettingsSwiftList({ children, bottomInset = 0 }: SettingsSwiftListProps) {
  const { theme, listModifiers } = useSettingsSwiftTheme();

  return (
    <Host
      colorScheme={theme.name}
      seedColor={theme.colors.primary}
      style={{ flex: 1, paddingBottom: bottomInset, backgroundColor: theme.colors.background }}
      useViewportSizeMeasurement
    >
      <List modifiers={listModifiers}>{children}</List>
    </Host>
  );
}

type SettingsSwiftSectionProps = {
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
};

export function SettingsSwiftSection({ title, footer, children }: SettingsSwiftSectionProps) {
  const { sectionHeaderModifiers, footerModifiers } = useSettingsSwiftTheme();

  return (
    <Section
      footer={footer ? footerText(footer, footerModifiers) : undefined}
      header={title ? <Text modifiers={sectionHeaderModifiers}>{title}</Text> : undefined}
    >
      {children}
    </Section>
  );
}

type SettingsSwiftNavRowProps = {
  systemImage: SFSymbol;
  iconBackgroundColor?: string;
  iconColor?: string;
  title: string;
  value?: string;
  showsChevron?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function SettingsSwiftIconTile({
  systemImage,
  backgroundColor,
  iconColor,
  elevated,
}: {
  systemImage: SFSymbol;
  backgroundColor: string;
  iconColor: string;
  elevated: boolean;
}) {
  return (
    <ZStack
      modifiers={[
        frame({ width: 28, height: 28 }),
        background(backgroundColor, shapes.roundedRectangle({ cornerRadius: 8 })),
        clipShape("roundedRectangle", 8),
        ...(elevated ? [shadow({ color: "rgba(0, 0, 0, 0.18)", radius: 5, x: 0, y: 3 })] : []),
      ]}
    >
      <Image color={iconColor} size={15} systemName={systemImage} />
    </ZStack>
  );
}

type SettingsSwiftToggleRowProps = {
  systemImage: SFSymbol;
  iconBackgroundColor: string;
  title: string;
  description?: string;
  isOn: boolean;
  onIsOnChange: (isOn: boolean) => void;
};

export function SettingsSwiftToggleRow({
  systemImage,
  iconBackgroundColor,
  title,
  description,
  isOn,
  onIsOnChange,
}: SettingsSwiftToggleRowProps) {
  const { rowBackground, rowTitleModifiers, rowDescriptionModifiers, theme } =
    useSettingsSwiftTheme();

  return (
    <Toggle isOn={isOn} modifiers={[rowBackground]} onIsOnChange={onIsOnChange}>
      <HStack alignment="center" spacing={12}>
        <SettingsSwiftIconTile
          backgroundColor={iconBackgroundColor}
          elevated={theme.name === "dark"}
          iconColor="#FFFFFF"
          systemImage={systemImage}
        />
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={rowTitleModifiers}>{title}</Text>
          {description ? <Text modifiers={rowDescriptionModifiers}>{description}</Text> : null}
        </VStack>
      </HStack>
    </Toggle>
  );
}

export function SettingsSwiftNavRow({
  systemImage,
  iconBackgroundColor,
  iconColor = "#FFFFFF",
  title,
  value,
  showsChevron = false,
  disabled: isDisabled = false,
  onPress,
}: SettingsSwiftNavRowProps) {
  const { rowBackground, rowTitleModifiers, rowValueModifiers, theme } = useSettingsSwiftTheme();

  return (
    <Button
      onPress={onPress}
      modifiers={[
        buttonStyle("plain"),
        rowBackground,
        rowHitArea,
        ...(isDisabled ? [disabled(true)] : []),
      ]}
    >
      <HStack alignment="center" modifiers={[rowHitArea]} spacing={12}>
        <SettingsSwiftIconTile
          backgroundColor={iconBackgroundColor ?? theme.colors.primary}
          elevated={theme.name === "dark"}
          iconColor={iconColor}
          systemImage={systemImage}
        />
        <Text modifiers={rowTitleModifiers}>{title}</Text>
        <Spacer />
        {value ? (
          <Text modifiers={rowValueModifiers}>{value}</Text>
        ) : showsChevron ? (
          <Image color={theme.colors.iconMuted} size={14} systemName="chevron.right" />
        ) : null}
      </HStack>
    </Button>
  );
}

type SettingsSwiftDetailRowProps = {
  title: string;
  description?: string;
  value?: string;
  systemImage?: SFSymbol;
  disabled?: boolean;
  onPress?: () => void;
};

function buildDetailTitle(
  title: string,
  description: string | undefined,
  systemImage: SFSymbol | undefined,
  theme: ReturnType<typeof useSettingsSwiftTheme>,
) {
  const { rowTitleModifiers, rowDescriptionModifiers } = theme;

  if (description) {
    if (systemImage) {
      return (
        <Label systemImage={systemImage} title={title}>
          <Text modifiers={rowTitleModifiers}>{title}</Text>
          <Text modifiers={rowDescriptionModifiers}>{description}</Text>
        </Label>
      );
    }

    return (
      <>
        <Text modifiers={rowTitleModifiers}>{title}</Text>
        <Text modifiers={rowDescriptionModifiers}>{description}</Text>
      </>
    );
  }

  if (systemImage) {
    return <Label modifiers={rowTitleModifiers} systemImage={systemImage} title={title} />;
  }

  return <Text modifiers={rowTitleModifiers}>{title}</Text>;
}

export function SettingsSwiftDetailRow({
  title,
  description,
  value,
  systemImage,
  disabled: isDisabled = false,
  onPress,
}: SettingsSwiftDetailRowProps) {
  const theme = useSettingsSwiftTheme();
  const titleContent = buildDetailTitle(title, description, systemImage, theme);

  if (!onPress) {
    return (
      <HStack alignment="center" modifiers={[theme.rowBackground]}>
        {titleContent}
        <Spacer />
        {value ? <Text modifiers={theme.rowValueModifiers}>{value}</Text> : null}
      </HStack>
    );
  }

  return (
    <Button
      onPress={onPress}
      modifiers={[
        buttonStyle("plain"),
        theme.rowBackground,
        rowHitArea,
        ...(isDisabled ? [disabled(true)] : []),
      ]}
    >
      <HStack alignment="center" modifiers={[rowHitArea]}>
        {titleContent}
        <Spacer />
        {value ? <Text modifiers={theme.rowValueModifiers}>{value}</Text> : null}
      </HStack>
    </Button>
  );
}

type SettingsSwiftDestructiveRowProps = {
  title: string;
  busyLabel?: string;
  disabled?: boolean;
  onPress: () => void;
};

export function SettingsSwiftDestructiveRow({
  title,
  busyLabel,
  disabled: isDisabled = false,
  onPress,
}: SettingsSwiftDestructiveRowProps) {
  const { theme, rowBackground } = useSettingsSwiftTheme();

  return (
    <Button
      label={busyLabel ?? title}
      onPress={onPress}
      role="destructive"
      modifiers={[
        buttonStyle("plain"),
        rowBackground,
        rowHitArea,
        font({ size: 14, weight: "medium" }),
        foregroundStyle(theme.colors.danger),
        ...(isDisabled ? [disabled(true)] : []),
      ]}
    />
  );
}

export function SettingsSwiftInfoRow({
  systemImage,
  title,
  subtitle,
}: {
  systemImage: SFSymbol;
  title: string;
  subtitle: string;
}) {
  const { rowBackground, rowTitleModifiers, rowDescriptionModifiers } = useSettingsSwiftTheme();

  return (
    <Label systemImage={systemImage} title={title} modifiers={[rowBackground]}>
      <Text modifiers={rowTitleModifiers}>{title}</Text>
      <Text modifiers={rowDescriptionModifiers}>{subtitle}</Text>
    </Label>
  );
}

export function SettingsSwiftFooterText({ children }: { children: ReactNode }) {
  const { footerModifiers } = useSettingsSwiftTheme();

  if (typeof children === "string") {
    return <Text modifiers={footerModifiers}>{children}</Text>;
  }

  return children;
}

export function SettingsSwiftBodyText({ children }: { children: string }) {
  const { rowTitleModifiers } = useSettingsSwiftTheme();

  return <Text modifiers={rowTitleModifiers}>{children}</Text>;
}

export function SettingsSwiftCaptionText({ children }: { children: string }) {
  const { rowDescriptionModifiers } = useSettingsSwiftTheme();

  return <Text modifiers={rowDescriptionModifiers}>{children}</Text>;
}
