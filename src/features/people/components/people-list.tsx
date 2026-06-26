import { forwardRef, memo, useCallback } from "react";

import { RefreshControl, type RefreshControlProps, StyleSheet, View } from "react-native";

import { FlashList, type FlashListRef } from "@shopify/flash-list";

import type { PersonListItemView } from "../view-models";
import { PersonCard } from "./person-card";

const ITEM_SEPARATOR_HEIGHT = 10;

type PeopleListProps = {
  people: PersonListItemView[];
  onPersonPress: (personId: string) => void;
  contentContainerStyle?: object;
  ListEmptyComponent?: React.ReactElement | null;
  ListHeaderComponent?: React.ReactElement | null;
  refreshControlProps?: RefreshControlProps;
};

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const PeopleListInner = forwardRef<FlashListRef<PersonListItemView>, PeopleListProps>(
  (
    {
      people,
      onPersonPress,
      contentContainerStyle,
      ListEmptyComponent,
      ListHeaderComponent,
      refreshControlProps,
    },
    ref,
  ) => {
    const renderItem = useCallback(
      ({ item }: { item: PersonListItemView }) => (
        <PersonCard person={item} onPress={() => onPersonPress(item.id)} />
      ),
      [onPersonPress],
    );

    const keyExtractor = useCallback((item: PersonListItemView) => item.id, []);

    return (
      <FlashList
        ref={ref}
        contentContainerStyle={contentContainerStyle}
        data={people}
        ItemSeparatorComponent={ItemSeparator}
        keyExtractor={keyExtractor}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={
          refreshControlProps ? <RefreshControl {...refreshControlProps} /> : undefined
        }
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    );
  },
);

PeopleListInner.displayName = "PeopleList";

export const PeopleList = memo(PeopleListInner);

PeopleList.displayName = "PeopleList";

const styles = StyleSheet.create({
  separator: {
    height: ITEM_SEPARATOR_HEIGHT,
  },
});
