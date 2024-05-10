import React, {useCallback} from 'react'
import {TouchableOpacity, View} from 'react-native'
import {KeyboardProvider} from 'react-native-keyboard-controller'
import {AppBskyActorDefs} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {useCurrentConvoId} from '#/state/messages/current-convo-id'
import {BACK_HITSLOP} from 'lib/constants'
import {isWeb} from 'platform/detection'
import {ConvoProvider, useConvo} from 'state/messages/convo'
import {ConvoStatus} from 'state/messages/convo/types'
import {PreviewableUserAvatar} from 'view/com/util/UserAvatar'
import {CenteredView} from 'view/com/util/Views'
import {MessagesList} from '#/screens/Messages/Conversation/MessagesList'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {ConvoMenu} from '#/components/dms/ConvoMenu'
import {Error} from '#/components/Error'
import {ListMaybePlaceholder} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {ClipClopGate} from '../gate'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'MessagesConversation'
>
export function MessagesConversationScreen({route}: Props) {
  const gate = useGate()
  const convoId = route.params.conversation
  const {setCurrentConvoId} = useCurrentConvoId()

  useFocusEffect(
    useCallback(() => {
      setCurrentConvoId(convoId)
      return () => {
        setCurrentConvoId(undefined)
      }
    }, [convoId, setCurrentConvoId]),
  )

  if (!gate('dms')) return <ClipClopGate />

  return (
    <ConvoProvider convoId={convoId}>
      <Inner />
    </ConvoProvider>
  )
}

function Inner() {
  const t = useTheme()
  const convo = useConvo()
  const {_} = useLingui()

  const [hasInitiallyRendered, setHasInitiallyRendered] = React.useState(false)

  // HACK: Because we need to scroll to the bottom of the list once initial items are added to the list, we also have
  // to take into account that scrolling to the end of the list on native will happen asynchronously. This will cause
  // a little flicker when the items are first renedered at the top and immediately scrolled to the bottom. to prevent
  // this, we will wait until the first render has completed to remove the loading overlay.
  React.useEffect(() => {
    if (
      !hasInitiallyRendered &&
      convo.status === ConvoStatus.Ready &&
      !convo.isFetchingHistory
    ) {
      setTimeout(() => {
        setHasInitiallyRendered(true)
      }, 15)
    }
  }, [convo.isFetchingHistory, convo.items, convo.status, hasInitiallyRendered])

  if (convo.status === ConvoStatus.Error) {
    return (
      <CenteredView style={a.flex_1} sideBorders>
        <Header />
        <Error
          title={_(msg`Something went wrong`)}
          message={_(msg`We couldn't load this conversation`)}
          onRetry={() => convo.error.retry()}
        />
      </CenteredView>
    )
  }

  /*
   * Any other convo states (atm) are "ready" states
   */

  return (
    <KeyboardProvider>
      <CenteredView style={a.flex_1} sideBorders>
        <Header profile={convo.recipients?.[0]} />
        <View style={[a.flex_1]}>
          {convo.status !== ConvoStatus.Ready ? (
            <ListMaybePlaceholder isLoading />
          ) : (
            <MessagesList />
          )}
          {!hasInitiallyRendered && (
            <View
              style={[
                a.absolute,
                a.z_10,
                a.w_full,
                a.h_full,
                a.justify_center,
                a.align_center,
                t.atoms.bg,
              ]}>
              <View style={[{marginBottom: 75}]}>
                <Loader size="xl" />
              </View>
            </View>
          )}
        </View>
      </CenteredView>
    </KeyboardProvider>
  )
}

let Header = ({
  profile,
}: {
  profile?: AppBskyActorDefs.ProfileViewBasic
}): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const {gtTablet} = useBreakpoints()
  const navigation = useNavigation<NavigationProp>()
  const convo = useConvo()

  const onPressBack = useCallback(() => {
    if (isWeb) {
      navigation.replace('Messages')
    } else {
      navigation.goBack()
    }
  }, [navigation])

  const onUpdateConvo = useCallback(() => {
    // TODO eric update muted state
  }, [])

  return (
    <View
      style={[
        t.atoms.bg,
        t.atoms.border_contrast_low,
        a.border_b,
        a.flex_row,
        a.justify_between,
        a.align_start,
        a.gap_lg,
        a.pl_xl,
        a.pr_lg,
        a.py_sm,
      ]}>
      {!gtTablet ? (
        <TouchableOpacity
          testID="conversationHeaderBackBtn"
          onPress={onPressBack}
          hitSlop={BACK_HITSLOP}
          style={{width: 30, height: 30}}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Back`)}
          accessibilityHint="">
          <FontAwesomeIcon
            size={18}
            icon="angle-left"
            style={{
              marginTop: 6,
            }}
            color={t.atoms.text.color}
          />
        </TouchableOpacity>
      ) : (
        <View style={{width: 30}} />
      )}
      <View style={[a.align_center, a.gap_sm, a.flex_1]}>
        {profile ? (
          <View style={[a.align_center]}>
            <PreviewableUserAvatar size={32} profile={profile} />
            <Text
              style={[a.text_lg, a.font_bold, isWeb ? a.mt_md : a.mt_sm]}
              numberOfLines={1}>
              {profile.displayName}
            </Text>
            <Text
              style={[t.atoms.text_contrast_medium, {fontSize: 15}]}
              numberOfLines={1}>
              @{profile.handle}
            </Text>
          </View>
        ) : (
          <>
            <View
              style={[
                {width: 32, height: 32},
                a.rounded_full,
                t.atoms.bg_contrast_25,
              ]}
            />
            <View
              style={[
                {width: 120, height: 16},
                a.rounded_xs,
                t.atoms.bg_contrast_25,
                a.mt_xs,
              ]}
            />
            <View
              style={[
                {width: 175, height: 12},
                a.rounded_xs,
                t.atoms.bg_contrast_25,
              ]}
            />
          </>
        )}
      </View>
      {convo.status === ConvoStatus.Ready && profile ? (
        <ConvoMenu
          convo={convo.convo}
          profile={profile}
          onUpdateConvo={onUpdateConvo}
          currentScreen="conversation"
        />
      ) : (
        <View style={{width: 30}} />
      )}
    </View>
  )
}
Header = React.memo(Header)
