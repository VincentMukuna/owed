import { forwardRef, memo, useCallback } from "react";

import { RefreshControl, type RefreshControlProps } from "react-native";

import { FlashList, type FlashListRef } from "@shopify/flash-list";

import { ListRowContainer } from "@/components/shared/list-inset-divider";

import type { PersonListItemView } from "../view-models";
import { PersonCard } from "./person-card";

const PEOPLE_LIST_TEXT_INSET = 54;

type PeopleListProps = {
  people: PersonListItemView[];
  onPersonPress: (personId: string) => void;
  contentContainerStyle?: object;
  ListEmptyComponent?: React.ReactElement | null;
  ListHeaderComponent?: React.ReactElement | null;
  refreshControlProps?: RefreshControlProps;
};

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
      ({ item, index }: { item: PersonListItemView; index: number }) => (
        <ListRowContainer leadingInset={PEOPLE_LIST_TEXT_INSET} showDivider={index > 0}>
          <PersonCard person={item} onPress={() => onPersonPress(item.id)} />
        </ListRowContainer>
      ),
      [onPersonPress],
    );

    const keyExtractor = useCallback((item: PersonListItemView) => item.id, []);

    return (
      <FlashList
        ref={ref}
        contentContainerStyle={contentContainerStyle}
        data={people}
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
