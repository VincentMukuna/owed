import { View } from "react-native";

import { ActivityTimelineRow } from "@/components/activity/activity-list";
import { HomeSection } from "@/features/dashboard/components/home-section";
import type { ActivityView } from "@/features/debts/view-models";

type HomeActivitySectionProps = {
  activities: ActivityView[];
  onSeeAll: () => void;
};

export function HomeActivitySection({ activities, onSeeAll }: HomeActivitySectionProps) {
  return (
    <HomeSection actionLabel="See all" onActionPress={onSeeAll} title="Recent activity">
      <View style={styles.timeline}>
        {activities.map((activity, index) => (
          <ActivityTimelineRow
            key={activity.id}
            activity={activity}
            showLeadingConnector={index > 0}
            showTrailingConnector={index < activities.length - 1}
          />
        ))}
      </View>
    </HomeSection>
  );
}

const styles = {
  timeline: {
    paddingHorizontal: 2,
  },
} as const;
