import { CircleHelp, Info, MessageSquareText } from "lucide-react-native";

import {
  SettingsCard,
  SettingsIconTile,
  SettingsNavRow,
  SettingsSection,
} from "@/features/settings/components/settings-ui";
import { useGetHelpActions } from "@/features/settings/hooks/use-get-help-actions";

const SETTINGS_ICON_SIZE = 16;

export function GetHelpSection() {
  const { handleAboutPress, handleHelpCenterPress, handleShareFeedbackPress } = useGetHelpActions();

  return (
    <SettingsSection title="Get Help">
      <SettingsCard>
        <SettingsNavRow
          label="Share feedback"
          leading={
            <SettingsIconTile backgroundColor="#DC2626">
              <MessageSquareText color="#FFFFFF" size={SETTINGS_ICON_SIZE} strokeWidth={2.2} />
            </SettingsIconTile>
          }
          onPress={handleShareFeedbackPress}
        />
        <SettingsNavRow
          bordered
          label="Help Center"
          leading={
            <SettingsIconTile backgroundColor="#0D9488">
              <CircleHelp color="#FFFFFF" size={SETTINGS_ICON_SIZE} strokeWidth={2.2} />
            </SettingsIconTile>
          }
          onPress={handleHelpCenterPress}
        />
        <SettingsNavRow
          bordered
          label="About"
          leading={
            <SettingsIconTile backgroundColor="#64748B">
              <Info color="#FFFFFF" size={SETTINGS_ICON_SIZE} strokeWidth={2.2} />
            </SettingsIconTile>
          }
          onPress={handleAboutPress}
        />
      </SettingsCard>
    </SettingsSection>
  );
}
