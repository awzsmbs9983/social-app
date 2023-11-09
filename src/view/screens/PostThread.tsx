import React, {useMemo} from 'react'
import {InteractionManager, StyleSheet, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useFocusEffect} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostThread as PostThreadComponent} from '../com/post-thread/PostThread'
import {ComposePrompt} from 'view/com/composer/Prompt'
import {PostThreadModel} from 'state/models/content/post-thread'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {clamp} from 'lodash'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {logger} from '#/logger'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {useSetMinimalShellMode} from '#/state/shell'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>
export const PostThreadScreen = withAuthRequired(
  observer(function PostThreadScreenImpl({route}: Props) {
    const store = useStores()
    const {fabMinimalShellTransform} = useMinimalShellMode()
    const setMinimalShellMode = useSetMinimalShellMode()
    const safeAreaInsets = useSafeAreaInsets()
    const {name, rkey} = route.params
    const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
    const view = useMemo<PostThreadModel>(
      () => new PostThreadModel(store, {uri}),
      [store, uri],
    )
    const {isMobile} = useWebMediaQueries()

    useFocusEffect(
      React.useCallback(() => {
        setMinimalShellMode(false)
        const threadCleanup = view.registerListeners()

        InteractionManager.runAfterInteractions(() => {
          if (!view.hasLoaded && !view.isLoading) {
            view.setup().catch(err => {
              logger.error('Failed to fetch thread', {error: err})
            })
          }
        })

        return () => {
          threadCleanup()
        }
      }, [view, setMinimalShellMode]),
    )

    const onPressReply = React.useCallback(() => {
      if (!view.thread) {
        return
      }
      store.shell.openComposer({
        replyTo: {
          uri: view.thread.post.uri,
          cid: view.thread.post.cid,
          text: view.thread.postRecord?.text as string,
          author: {
            handle: view.thread.post.author.handle,
            displayName: view.thread.post.author.displayName,
            avatar: view.thread.post.author.avatar,
          },
        },
        onPost: () => view.refresh(),
      })
    }, [view, store])

    return (
      <View style={s.hContentRegion}>
        {isMobile && <ViewHeader title="Post" />}
        <View style={s.flex1}>
          <PostThreadComponent
            uri={uri}
            view={view}
            onPressReply={onPressReply}
            treeView={!!store.preferences.thread.lab_treeViewEnabled}
          />
        </View>
        {isMobile && (
          <Animated.View
            style={[
              styles.prompt,
              fabMinimalShellTransform,
              {
                bottom: clamp(safeAreaInsets.bottom, 15, 30),
              },
            ]}>
            <ComposePrompt onPressCompose={onPressReply} />
          </Animated.View>
        )}
      </View>
    )
  }),
)

const styles = StyleSheet.create({
  prompt: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
})
