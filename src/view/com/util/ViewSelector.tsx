import React, {useEffect, useState} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {FlatList} from './Views'
import {OnScrollCb} from 'lib/hooks/useOnMainScroll'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {Text} from './text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {clamp} from 'lib/numbers'
import {s, colors} from 'lib/styles'
import {isAndroid} from 'platform/detection'

const HEADER_ITEM = {_reactKey: '__header__'}
const SELECTOR_ITEM = {_reactKey: '__selector__'}
const STICKY_HEADER_INDICES = [1]

export function ViewSelector({
  sections,
  items,
  refreshing,
  renderHeader,
  renderItem,
  ListFooterComponent,
  onSelectView,
  onScroll,
  onRefresh,
  onEndReached,
}: {
  sections: string[]
  items: any[]
  refreshing?: boolean
  swipeEnabled?: boolean
  renderHeader?: () => JSX.Element
  renderItem: (item: any) => JSX.Element
  ListFooterComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined
  onSelectView?: (viewIndex: number) => void
  onScroll?: OnScrollCb
  onRefresh?: () => void
  onEndReached?: (info: {distanceFromEnd: number}) => void
}) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0)

  // events
  // =

  const keyExtractor = React.useCallback(item => item._reactKey, [])

  const onPressSelection = React.useCallback(
    (index: number) => setSelectedIndex(clamp(index, 0, sections.length)),
    [setSelectedIndex, sections],
  )
  useEffect(() => {
    onSelectView?.(selectedIndex)
  }, [selectedIndex, onSelectView])

  // rendering
  // =

  const renderItemInternal = React.useCallback(
    ({item}: {item: any}) => {
      if (item === HEADER_ITEM) {
        if (renderHeader) {
          return renderHeader()
        }
        return <View />
      } else if (item === SELECTOR_ITEM) {
        return (
          <Selector
            items={sections}
            selectedIndex={selectedIndex}
            onSelect={onPressSelection}
          />
        )
      } else {
        return renderItem(item)
      }
    },
    [sections, selectedIndex, onPressSelection, renderHeader, renderItem],
  )

  const data = React.useMemo(
    () => [HEADER_ITEM, SELECTOR_ITEM, ...items],
    [items],
  )
  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItemInternal}
      ListFooterComponent={ListFooterComponent}
      // NOTE sticky header disabled on android due to major performance issues -prf
      stickyHeaderIndices={isAndroid ? undefined : STICKY_HEADER_INDICES}
      refreshing={refreshing}
      onScroll={onScroll}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      contentContainerStyle={s.contentContainer}
      removeClippedSubviews={true}
      scrollIndicatorInsets={{right: 1}} // fixes a bug where the scroll indicator is on the middle of the screen https://github.com/bluesky-social/social-app/pull/464
    />
  )
}

export function Selector({
  selectedIndex,
  items,
  onSelect,
}: {
  selectedIndex: number
  items: string[]
  onSelect?: (index: number) => void
}) {
  const pal = usePalette('default')
  const borderColor = useColorSchemeStyle(
    {borderColor: colors.black},
    {borderColor: colors.white},
  )

  const onPressItem = (index: number) => {
    onSelect?.(index)
  }

  return (
    <View style={[pal.view, styles.outer]}>
      {items.map((item, i) => {
        const selected = i === selectedIndex
        return (
          <Pressable
            testID={`selector-${i}`}
            key={item}
            onPress={() => onPressItem(i)}
            accessibilityLabel={item}
            accessibilityHint={`Selects ${item}`}
            // TODO: Modify the component API such that lint fails
            // at the invocation site as well
          >
            <View
              style={[
                styles.item,
                selected && styles.itemSelected,
                borderColor,
              ]}>
              <Text
                style={
                  selected
                    ? [styles.labelSelected, pal.text]
                    : [styles.label, pal.textLight]
                }>
                {item}
              </Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
  },
  item: {
    marginRight: 14,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 12,
  },
  itemSelected: {
    borderBottomWidth: 3,
  },
  label: {
    fontWeight: '600',
  },
  labelSelected: {
    fontWeight: '600',
  },
  underline: {
    position: 'absolute',
    height: 4,
    bottom: 0,
  },
})
