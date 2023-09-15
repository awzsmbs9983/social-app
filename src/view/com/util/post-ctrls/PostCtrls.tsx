import React, {useCallback} from 'react'
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {Text} from '../text/Text'
import {PostDropdownBtn} from '../forms/PostDropdownBtn'
import {HeartIcon, HeartIconSolid, CommentBottomArrow} from 'lib/icons'
import {s, colors} from 'lib/styles'
import {pluralize} from 'lib/strings/helpers'
import {useTheme} from 'lib/ThemeContext'
import {useStores} from 'state/index'
import {RepostButton} from './RepostButton'
import {Haptics} from 'lib/haptics'
import {HITSLOP_10, HITSLOP_20} from 'lib/constants'

interface PostCtrlsOpts {
  itemUri: string
  itemCid: string
  itemHref: string
  itemTitle: string
  isAuthor: boolean
  author: {
    did: string
    handle: string
    displayName?: string | undefined
    avatar?: string | undefined
  }
  text: string
  indexedAt: string
  big?: boolean
  style?: StyleProp<ViewStyle>
  replyCount?: number
  repostCount?: number
  likeCount?: number
  isReposted: boolean
  isLiked: boolean
  isThreadMuted: boolean
  onPressReply: () => void
  onPressToggleRepost: () => Promise<void>
  onPressToggleLike: () => Promise<void>
  onCopyPostText: () => void
  onOpenTranslate: () => void
  onToggleThreadMute: () => void
  onDeletePost: () => void
}

export function PostCtrls(opts: PostCtrlsOpts) {
  const store = useStores()
  const theme = useTheme()
  const defaultCtrlColor = React.useMemo(
    () => ({
      color: theme.palette.default.postCtrl,
    }),
    [theme],
  ) as StyleProp<ViewStyle>
  const onRepost = useCallback(() => {
    store.shell.closeModal()
    if (!opts.isReposted) {
      Haptics.default()
      opts.onPressToggleRepost().catch(_e => undefined)
    } else {
      opts.onPressToggleRepost().catch(_e => undefined)
    }
  }, [opts, store.shell])

  const onQuote = useCallback(() => {
    store.shell.closeModal()
    store.shell.openComposer({
      quote: {
        uri: opts.itemUri,
        cid: opts.itemCid,
        text: opts.text,
        author: opts.author,
        indexedAt: opts.indexedAt,
      },
    })
    Haptics.default()
  }, [
    opts.author,
    opts.indexedAt,
    opts.itemCid,
    opts.itemUri,
    opts.text,
    store.shell,
  ])

  const onPressToggleLikeWrapper = async () => {
    if (!opts.isLiked) {
      Haptics.default()
      await opts.onPressToggleLike().catch(_e => undefined)
    } else {
      await opts.onPressToggleLike().catch(_e => undefined)
    }
  }

  return (
    <View style={[styles.ctrls, opts.style]}>
      <TouchableOpacity
        testID="replyBtn"
        style={[styles.ctrl, !opts.big && styles.ctrlPad, {paddingLeft: 0}]}
        onPress={opts.onPressReply}
        accessibilityRole="button"
        accessibilityLabel={`Reply (${opts.replyCount} ${
          opts.replyCount === 1 ? 'reply' : 'replies'
        })`}
        accessibilityHint=""
        hitSlop={opts.big ? HITSLOP_20 : HITSLOP_10}>
        <CommentBottomArrow
          style={[defaultCtrlColor, opts.big ? s.mt2 : styles.mt1]}
          strokeWidth={3}
          size={opts.big ? 20 : 15}
        />
        {typeof opts.replyCount !== 'undefined' ? (
          <Text style={[defaultCtrlColor, s.ml5, s.f15]}>
            {opts.replyCount}
          </Text>
        ) : undefined}
      </TouchableOpacity>
      <RepostButton {...opts} onRepost={onRepost} onQuote={onQuote} />
      <TouchableOpacity
        testID="likeBtn"
        style={[styles.ctrl, !opts.big && styles.ctrlPad]}
        onPress={onPressToggleLikeWrapper}
        accessibilityRole="button"
        accessibilityLabel={`${opts.isLiked ? 'Unlike' : 'Like'} (${
          opts.likeCount
        } ${pluralize(opts.likeCount || 0, 'like')})`}
        accessibilityHint=""
        hitSlop={opts.big ? HITSLOP_20 : HITSLOP_10}>
        {opts.isLiked ? (
          <HeartIconSolid
            style={styles.ctrlIconLiked}
            size={opts.big ? 22 : 16}
          />
        ) : (
          <HeartIcon
            style={[defaultCtrlColor, opts.big ? styles.mt1 : undefined]}
            strokeWidth={3}
            size={opts.big ? 20 : 16}
          />
        )}
        {typeof opts.likeCount !== 'undefined' ? (
          <Text
            testID="likeCount"
            style={
              opts.isLiked
                ? [s.bold, s.red3, s.f15, s.ml5]
                : [defaultCtrlColor, s.f15, s.ml5]
            }>
            {opts.likeCount}
          </Text>
        ) : undefined}
      </TouchableOpacity>
      {opts.big ? undefined : (
        <PostDropdownBtn
          testID="postDropdownBtn"
          itemUri={opts.itemUri}
          itemCid={opts.itemCid}
          itemHref={opts.itemHref}
          itemTitle={opts.itemTitle}
          isAuthor={opts.isAuthor}
          isThreadMuted={opts.isThreadMuted}
          onCopyPostText={opts.onCopyPostText}
          onOpenTranslate={opts.onOpenTranslate}
          onToggleThreadMute={opts.onToggleThreadMute}
          onDeletePost={opts.onDeletePost}
          style={styles.ctrlPad}
        />
      )}
      {/* used for adding pad to the right side */}
      <View />
    </View>
  )
}

const styles = StyleSheet.create({
  ctrls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ctrl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctrlPad: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 5,
    paddingRight: 5,
  },
  ctrlIconLiked: {
    color: colors.like,
  },
  mt1: {
    marginTop: 1,
  },
})
