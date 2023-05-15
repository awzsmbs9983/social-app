import React, {useCallback} from 'react'
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback'
// DISABLED see #135
// import {
//   TriggerableAnimated,
//   TriggerableAnimatedRef,
// } from './anim/TriggerableAnimated'
import {Text} from '../text/Text'
import {PostDropdownBtn} from '../forms/DropdownButton'
import {HeartIcon, HeartIconSolid, CommentBottomArrow} from 'lib/icons'
import {s, colors} from 'lib/styles'
import {useTheme} from 'lib/ThemeContext'
import {useStores} from 'state/index'
import {isIOS, isNative} from 'platform/detection'
import {RepostButton} from './RepostButton'

interface PostCtrlsOpts {
  itemUri: string
  itemCid: string
  itemHref: string
  itemTitle: string
  isAuthor: boolean
  author: {
    handle: string
    displayName: string
    avatar: string
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

const HITSLOP = {top: 5, left: 5, bottom: 5, right: 5}
const hapticImpact: HapticFeedbackTypes = isIOS ? 'impactMedium' : 'impactLight' // Users said the medium impact was too strong on Android; see APP-537

// DISABLED see #135
/*
function ctrlAnimStart(interp: Animated.Value) {
  return Animated.sequence([
    Animated.timing(interp, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }),
    Animated.delay(50),
    Animated.timing(interp, {
      toValue: 0,
      duration: 20,
      useNativeDriver: true,
    }),
  ])
}

function ctrlAnimStyle(interp: Animated.Value) {
  return {
    transform: [
      {
        scale: interp.interpolate({
          inputRange: [0, 1.0],
          outputRange: [1.0, 4.0],
        }),
      },
    ],
    opacity: interp.interpolate({
      inputRange: [0, 1.0],
      outputRange: [1.0, 0.0],
    }),
  }
}
*/

export function PostCtrls(opts: PostCtrlsOpts) {
  const store = useStores()
  const theme = useTheme()
  const defaultCtrlColor = React.useMemo(
    () => ({
      color: theme.palette.default.postCtrl,
    }),
    [theme],
  ) as StyleProp<ViewStyle>
  // DISABLED see #135
  // const repostRef = React.useRef<TriggerableAnimatedRef | null>(null)
  // const likeRef = React.useRef<TriggerableAnimatedRef | null>(null)
  const onRepost = useCallback(() => {
    store.shell.closeModal()
    if (!opts.isReposted) {
      if (isNative) {
        ReactNativeHapticFeedback.trigger(hapticImpact)
      }
      opts.onPressToggleRepost().catch(_e => undefined)
      // DISABLED see #135
      // repostRef.current?.trigger(
      //   {start: ctrlAnimStart, style: ctrlAnimStyle},
      //   async () => {
      //     await opts.onPressToggleRepost().catch(_e => undefined)
      //     setRepostMod(0)
      //   },
      // )
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

    if (isNative) {
      ReactNativeHapticFeedback.trigger(hapticImpact)
    }
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
      ReactNativeHapticFeedback.trigger(hapticImpact)
      await opts.onPressToggleLike().catch(_e => undefined)
      // DISABLED see #135
      // likeRef.current?.trigger(
      //   {start: ctrlAnimStart, style: ctrlAnimStyle},
      //   async () => {
      //     await opts.onPressToggleLike().catch(_e => undefined)
      //     setLikeMod(0)
      //   },
      // )
      // setIsLikedPressed(false)
    } else {
      await opts.onPressToggleLike().catch(_e => undefined)
      // setIsLikedPressed(false)
    }
  }

  return (
    <View style={[styles.ctrls, opts.style]}>
      <TouchableOpacity
        testID="replyBtn"
        style={styles.ctrl}
        hitSlop={HITSLOP}
        onPress={opts.onPressReply}
        accessibilityRole="button"
        accessibilityLabel="Reply"
        accessibilityHint="reply composer">
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
        style={styles.ctrl}
        hitSlop={HITSLOP}
        onPress={onPressToggleLikeWrapper}
        accessibilityRole="button"
        accessibilityLabel={opts.isLiked ? 'Unlike' : 'Like'}
        accessibilityHint={
          opts.isReposted ? `Removes like from the post` : `Like the post`
        }>
        {opts.isLiked ? (
          <HeartIconSolid
            style={styles.ctrlIconLiked as StyleProp<ViewStyle>}
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
      <View>
        {opts.big ? undefined : (
          <PostDropdownBtn
            testID="postDropdownBtn"
            style={styles.ctrl}
            itemUri={opts.itemUri}
            itemCid={opts.itemCid}
            itemHref={opts.itemHref}
            itemTitle={opts.itemTitle}
            isAuthor={opts.isAuthor}
            isThreadMuted={opts.isThreadMuted}
            onCopyPostText={opts.onCopyPostText}
            onOpenTranslate={opts.onOpenTranslate}
            onToggleThreadMute={opts.onToggleThreadMute}
            onDeletePost={opts.onDeletePost}>
            <FontAwesomeIcon
              icon="ellipsis-h"
              size={18}
              style={[
                s.mt2,
                s.mr5,
                {
                  color:
                    theme.colorScheme === 'light' ? colors.gray4 : colors.gray5,
                } as FontAwesomeIconStyle,
              ]}
            />
          </PostDropdownBtn>
        )}
      </View>
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
    padding: 5,
    margin: -5,
  },
  ctrlIconLiked: {
    color: colors.red3,
  },
  mt1: {
    marginTop: 1,
  },
})
