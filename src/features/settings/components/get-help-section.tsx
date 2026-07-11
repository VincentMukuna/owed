import { CircleHelp, Flag, Info } from "lucide-react-native";
import { useUnistyles } from "react-native-unistyles";

import {
  SettingsCard,
  SettingsNavRow,
  SettingsSection,
} from "@/features/settings/components/settings-ui";
import { useGetHelpActions } from "@/features/settings/hooks/use-get-help-actions";

const SETTINGS_ICON_SIZE = 18;

export function GetHelpSection() {
  const { theme } = useUnistyles();
  const { handleAboutPress, handleHelpCenterPress, handleReportIssue } = useGetHelpActions();
  const iconColor = theme.colors.text;

  return (
    <SettingsSection title="Get Help">
      <SettingsCard>
        <SettingsNavRow
          label="Report an issue"
          leading={<Flag color={iconColor} size={SETTINGS_ICON_SIZE} strokeWidth={2} />}
          onPress={handleReportIssue}
        />
        <SettingsNavRow
          bordered
          label="Help Center"
          leading={<CircleHelp color={iconColor} size={SETTINGS_ICON_SIZE} strokeWidth={2} />}
          onPress={handleHelpCenterPress}
        />
        <SettingsNavRow
          bordered
          label="About"
          leading={<Info color={iconColor} size={SETTINGS_ICON_SIZE} strokeWidth={2} />}
          onPress={handleAboutPress}
        />
      </SettingsCard>
    </SettingsSection>
  );
}
