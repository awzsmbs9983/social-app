import React from 'react'
import {View, ActivityIndicator, StyleSheet} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, HomeTabNavigatorParams} from 'lib/routes/types'
import {FeedDescriptor, FeedParams} from '#/state/queries/post-feed'
import {FollowingEmptyState} from 'view/com/posts/FollowingEmptyState'
import {FollowingEndOfFeed} from 'view/com/posts/FollowingEndOfFeed'
import {CustomFeedEmptyState} from 'view/com/posts/CustomFeedEmptyState'
import {FeedsTabBar} from '../com/pager/FeedsTabBar'
import {Pager, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {FeedPage} from 'view/com/feeds/FeedPage'
import {useSetMinimalShellMode, useSetDrawerSwipeDisabled} from '#/state/shell'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
import {emitSoftReset} from '#/state/events'
import {useSession} from '#/state/session'
import {save, load} from '#/lib/storage'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'Home'>
export function HomeScreen(props: Props) {
  const {data: preferences} = usePreferencesQuery()
  const {isDesktop} = useWebMediaQueries()
  const [lastActiveTab, setLastActiveTab] = React.useState<number | undefined>(
    undefined,
  )

  React.useEffect(() => {
    const loadLastActieTab = async () => {
      try {
        const savedTab = await load('lastActiveTab')
        const tabIndex = savedTab ? parseInt(savedTab, 10) : 0
        setLastActiveTab(tabIndex)
      } catch {
        setLastActiveTab(0)
      }
    }
    // Ignoring lastActiveTab for desktop
    if (isDesktop) {
      setLastActiveTab(0)
    } else {
      loadLastActieTab()
    }
  }, [isDesktop])

  if (preferences && lastActiveTab !== undefined) {
    return (
      <HomeScreenReady
        {...props}
        preferences={preferences}
        lastActiveTab={lastActiveTab}
      />
    )
  } else {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    )
  }
}

function HomeScreenReady({
  preferences,
  lastActiveTab,
}: Props & {
  preferences: UsePreferencesQueryResponse
  lastActiveTab: number
}) {
  const {hasSession} = useSession()
  const setMinimalShellMode = useSetMinimalShellMode()
  const setDrawerSwipeDisabled = useSetDrawerSwipeDisabled()
  const [selectedPage, setSelectedPage] = React.useState(lastActiveTab)

  /**
   * Used to ensure that we re-compute `customFeeds` AND force a re-render of
   * the pager with the new order of feeds.
   */
  const pinnedFeedOrderKey = JSON.stringify(preferences.feeds.pinned)

  const customFeeds = React.useMemo(() => {
    const pinned = preferences.feeds.pinned
    const feeds: FeedDescriptor[] = []
    for (const uri of pinned) {
      if (uri.includes('app.bsky.feed.generator')) {
        feeds.push(`feedgen|${uri}`)
      } else if (uri.includes('app.bsky.graph.list')) {
        feeds.push(`list|${uri}`)
      }
    }
    return feeds
  }, [preferences.feeds.pinned])

  const homeFeedParams = React.useMemo<FeedParams>(() => {
    return {
      mergeFeedEnabled: Boolean(preferences.feedViewPrefs.lab_mergeFeedEnabled),
      mergeFeedSources: preferences.feeds.saved,
    }
  }, [preferences])

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
      setDrawerSwipeDisabled(selectedPage > 0)
      return () => {
        setDrawerSwipeDisabled(false)
      }
    }, [setDrawerSwipeDisabled, selectedPage, setMinimalShellMode]),
  )

  const onPageSelected = React.useCallback(
    (index: number) => {
      setMinimalShellMode(false)
      setSelectedPage(index)
      save('lastActiveTab', index)
      setDrawerSwipeDisabled(index > 0)
    },
    [setDrawerSwipeDisabled, setSelectedPage, setMinimalShellMode],
  )

  const onPressSelected = React.useCallback(() => {
    emitSoftReset()
  }, [])

  const onPageScrollStateChanged = React.useCallback(
    (state: 'idle' | 'dragging' | 'settling') => {
      if (state === 'dragging') {
        setMinimalShellMode(false)
      }
    },
    [setMinimalShellMode],
  )

  const renderTabBar = React.useCallback(
    (props: RenderTabBarFnProps) => {
      return (
        <FeedsTabBar
          key="FEEDS_TAB_BAR"
          selectedPage={props.selectedPage}
          onSelect={props.onSelect}
          testID="homeScreenFeedTabs"
          onPressSelected={onPressSelected}
        />
      )
    },
    [onPressSelected],
  )

  const renderFollowingEmptyState = React.useCallback(() => {
    return <FollowingEmptyState />
  }, [])

  const renderCustomFeedEmptyState = React.useCallback(() => {
    return <CustomFeedEmptyState />
  }, [])

  return hasSession ? (
    <Pager
      key={pinnedFeedOrderKey}
      testID="homeScreen"
      initialPage={selectedPage > customFeeds.length ? 0 : selectedPage}
      onPageSelected={onPageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
      renderTabBar={renderTabBar}
      tabBarPosition="top">
      <FeedPage
        key="1"
        testID="followingFeedPage"
        isPageFocused={selectedPage === 0}
        feed={homeFeedParams.mergeFeedEnabled ? 'home' : 'following'}
        feedParams={homeFeedParams}
        renderEmptyState={renderFollowingEmptyState}
        renderEndOfFeed={FollowingEndOfFeed}
      />
      {customFeeds.map((f, index) => {
        return (
          <FeedPage
            key={f}
            testID="customFeedPage"
            isPageFocused={selectedPage === 1 + index}
            feed={f}
            renderEmptyState={renderCustomFeedEmptyState}
          />
        )
      })}
    </Pager>
  ) : (
    <Pager
      testID="homeScreen"
      onPageSelected={onPageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
      renderTabBar={renderTabBar}
      tabBarPosition="top">
      <FeedPage
        testID="customFeedPage"
        isPageFocused
        feed={`feedgen|at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot`}
        renderEmptyState={renderCustomFeedEmptyState}
      />
    </Pager>
  )
}

const styles = StyleSheet.create({
  loading: {
    height: '100%',
    alignContent: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
})
