import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {RichText} from '@atproto/api'
import {useAnalytics} from 'lib/analytics'
import {UserAutocompleteModel} from 'state/models/discovery/user-autocomplete'
import {ExternalEmbed} from './ExternalEmbed'
import {Text} from '../util/text/Text'
import * as Toast from '../util/Toast'
import {TextInput, TextInputRef} from './text-input/TextInput'
import {CharProgress} from './char-progress/CharProgress'
import {UserAvatar} from '../util/UserAvatar'
import {useStores} from 'state/index'
import * as apilib from 'lib/api/index'
import {ComposerOpts} from 'state/models/ui/shell'
import {s, colors, gradients} from 'lib/styles'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {cleanError} from 'lib/strings/errors'
import {SelectPhotoBtn} from './photos/SelectPhotoBtn'
import {OpenCameraBtn} from './photos/OpenCameraBtn'
import {SelectedPhotos} from './photos/SelectedPhotos'
import {usePalette} from 'lib/hooks/usePalette'
import QuoteEmbed from '../util/post-embeds/QuoteEmbed'
import {useExternalLinkFetch} from './useExternalLinkFetch'
import {isDesktopWeb} from 'platform/detection'

const MAX_GRAPHEME_LENGTH = 300

export const ComposePost = observer(function ComposePost({
  replyTo,
  onPost,
  onClose,
  quote: initQuote,
}: {
  replyTo?: ComposerOpts['replyTo']
  onPost?: ComposerOpts['onPost']
  onClose: () => void
  quote?: ComposerOpts['quote']
}) {
  const {track} = useAnalytics()
  const pal = usePalette('default')
  const store = useStores()
  const textInput = React.useRef<TextInputRef>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [processingState, setProcessingState] = React.useState('')
  const [error, setError] = React.useState('')
  const [richtext, setRichText] = React.useState(new RichText({text: ''}))
  const graphemeLength = React.useMemo(
    () => richtext.graphemeLength,
    [richtext],
  )
  const [quote, setQuote] = React.useState<ComposerOpts['quote'] | undefined>(
    initQuote,
  )
  const {extLink, setExtLink} = useExternalLinkFetch({setQuote})
  const [suggestedLinks, setSuggestedLinks] = React.useState<Set<string>>(
    new Set(),
  )
  const [selectedPhotos, setSelectedPhotos] = React.useState<string[]>([])

  const autocompleteView = React.useMemo<UserAutocompleteModel>(
    () => new UserAutocompleteModel(store),
    [store],
  )

  // HACK
  // there's a bug with @mattermost/react-native-paste-input where if the input
  // is focused during unmount, an exception will throw (seems that a blur method isnt implemented)
  // manually blurring before closing gets around that
  // -prf
  const hackfixOnClose = React.useCallback(() => {
    textInput.current?.blur()
    onClose()
  }, [textInput, onClose])

  // initial setup
  React.useEffect(() => {
    autocompleteView.setup()
  }, [autocompleteView])

  React.useEffect(() => {
    // HACK
    // wait a moment before focusing the input to resolve some layout bugs with the keyboard-avoiding-view
    // -prf
    let to: NodeJS.Timeout | undefined
    if (textInput.current) {
      to = setTimeout(() => {
        textInput.current?.focus()
      }, 250)
    }
    return () => {
      if (to) {
        clearTimeout(to)
      }
    }
  }, [])

  const onPressContainer = React.useCallback(() => {
    textInput.current?.focus()
  }, [textInput])

  const onSelectPhotos = React.useCallback(
    (photos: string[]) => {
      track('Composer:SelectedPhotos')
      setSelectedPhotos(photos)
    },
    [track, setSelectedPhotos],
  )

  const onPressAddLinkCard = React.useCallback(
    (uri: string) => {
      setExtLink({uri, isLoading: true})
    },
    [setExtLink],
  )

  const onPhotoPasted = React.useCallback(
    async (uri: string) => {
      if (selectedPhotos.length >= 4) {
        return
      }
      onSelectPhotos([...selectedPhotos, uri])
    },
    [selectedPhotos, onSelectPhotos],
  )

  const onPressPublish = React.useCallback(async () => {
    if (isProcessing) {
      return
    }
    if (richtext.graphemeLength > MAX_GRAPHEME_LENGTH) {
      return
    }
    setError('')
    if (richtext.text.trim().length === 0 && selectedPhotos.length === 0) {
      setError('Did you want to say anything?')
      return false
    }
    setIsProcessing(true)
    try {
      await apilib.post(store, {
        rawText: richtext.text,
        replyTo: replyTo?.uri,
        images: selectedPhotos,
        quote: quote,
        extLink: extLink,
        onStateChange: setProcessingState,
        knownHandles: autocompleteView.knownHandles,
      })
      track('Create Post', {
        imageCount: selectedPhotos.length,
      })
    } catch (e: any) {
      if (extLink) {
        setExtLink({
          ...extLink,
          isLoading: true,
          localThumb: undefined,
        } as apilib.ExternalEmbedDraft)
      }
      setError(cleanError(e.message))
      setIsProcessing(false)
      return
    }
    store.me.mainFeed.checkForLatest({autoPrepend: true})
    onPost?.()
    hackfixOnClose()
    Toast.show(`Your ${replyTo ? 'reply' : 'post'} has been published`)
  }, [
    isProcessing,
    richtext,
    setError,
    setIsProcessing,
    replyTo,
    autocompleteView.knownHandles,
    extLink,
    hackfixOnClose,
    onPost,
    quote,
    selectedPhotos,
    setExtLink,
    store,
    track,
  ])

  const canPost = graphemeLength <= MAX_GRAPHEME_LENGTH

  const selectTextInputPlaceholder = replyTo
    ? 'Write your reply'
    : selectedPhotos.length !== 0
    ? 'Write a comment'
    : "What's up?"

  return (
    <KeyboardAvoidingView
      testID="composePostView"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.outer}>
      <TouchableWithoutFeedback onPressIn={onPressContainer}>
        <SafeAreaView style={[s.flex1]}>
          <View style={styles.topbar}>
            <TouchableOpacity
              testID="composerCancelButton"
              onPress={hackfixOnClose}>
              <Text style={[pal.link, s.f18]}>Cancel</Text>
            </TouchableOpacity>
            <View style={s.flex1} />
            {isProcessing ? (
              <View style={styles.postBtn}>
                <ActivityIndicator />
              </View>
            ) : canPost ? (
              <TouchableOpacity
                testID="composerPublishBtn"
                onPress={onPressPublish}>
                <LinearGradient
                  colors={[gradients.blueLight.start, gradients.blueLight.end]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.postBtn}>
                  <Text style={[s.white, s.f16, s.bold]}>
                    {replyTo ? 'Reply' : 'Post'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={[styles.postBtn, pal.btn]}>
                <Text style={[pal.textLight, s.f16, s.bold]}>Post</Text>
              </View>
            )}
          </View>
          {isProcessing ? (
            <View style={[pal.btn, styles.processingLine]}>
              <Text style={pal.text}>{processingState}</Text>
            </View>
          ) : undefined}
          {error !== '' && (
            <View style={styles.errorLine}>
              <View style={styles.errorIcon}>
                <FontAwesomeIcon
                  icon="exclamation"
                  style={{color: colors.red4}}
                  size={10}
                />
              </View>
              <Text style={[s.red4, s.flex1]}>{error}</Text>
            </View>
          )}
          <ScrollView
            style={styles.scrollView}
            keyboardShouldPersistTaps="always">
            {replyTo ? (
              <View style={[pal.border, styles.replyToLayout]}>
                <UserAvatar avatar={replyTo.author.avatar} size={50} />
                <View style={styles.replyToPost}>
                  <Text type="xl-medium" style={[pal.text]}>
                    {sanitizeDisplayName(
                      replyTo.author.displayName || replyTo.author.handle,
                    )}
                  </Text>
                  <Text type="post-text" style={pal.text} numberOfLines={6}>
                    {replyTo.text}
                  </Text>
                </View>
              </View>
            ) : undefined}

            <View style={[pal.border, styles.textInputLayout]}>
              <UserAvatar avatar={store.me.avatar} size={50} />
              <TextInput
                ref={textInput}
                richtext={richtext}
                placeholder={selectTextInputPlaceholder}
                suggestedLinks={suggestedLinks}
                autocompleteView={autocompleteView}
                setRichText={setRichText}
                onPhotoPasted={onPhotoPasted}
                onSuggestedLinksChanged={setSuggestedLinks}
                onError={setError}
              />
            </View>

            <SelectedPhotos
              selectedPhotos={selectedPhotos}
              onSelectPhotos={onSelectPhotos}
            />
            {selectedPhotos.length === 0 && extLink && (
              <ExternalEmbed
                link={extLink}
                onRemove={() => setExtLink(undefined)}
              />
            )}
            {quote ? (
              <View style={s.mt5}>
                <QuoteEmbed quote={quote} />
              </View>
            ) : undefined}
          </ScrollView>
          {!extLink &&
          selectedPhotos.length === 0 &&
          suggestedLinks.size > 0 ? (
            <View style={s.mb5}>
              {Array.from(suggestedLinks).map(url => (
                <TouchableOpacity
                  key={`suggested-${url}`}
                  testID="addLinkCardBtn"
                  style={[pal.borderDark, styles.addExtLinkBtn]}
                  onPress={() => onPressAddLinkCard(url)}>
                  <Text style={pal.text}>
                    Add link card: <Text style={pal.link}>{url}</Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          <View style={[pal.border, styles.bottomBar]}>
            <SelectPhotoBtn
              enabled={selectedPhotos.length < 4}
              selectedPhotos={selectedPhotos}
              onSelectPhotos={setSelectedPhotos}
            />
            <OpenCameraBtn
              enabled={selectedPhotos.length < 4}
              selectedPhotos={selectedPhotos}
              onSelectPhotos={setSelectedPhotos}
            />
            <View style={s.flex1} />
            <CharProgress count={graphemeLength} />
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
})

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'column',
    flex: 1,
    height: '100%',
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: isDesktopWeb ? 10 : undefined,
    paddingBottom: 10,
    paddingHorizontal: 20,
    height: 55,
  },
  postBtn: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  processingLine: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginHorizontal: 15,
    marginBottom: 6,
  },
  errorLine: {
    flexDirection: 'row',
    backgroundColor: colors.red1,
    borderRadius: 6,
    marginHorizontal: 15,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 6,
  },
  errorIcon: {
    borderWidth: 1,
    borderColor: colors.red4,
    color: colors.red4,
    borderRadius: 30,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
  },
  textInputLayout: {
    flex: isDesktopWeb ? undefined : 1,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  replyToLayout: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 16,
    paddingBottom: 16,
  },
  replyToPost: {
    flex: 1,
    paddingLeft: 13,
    paddingRight: 8,
  },
  addExtLinkBtn: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 10,
    marginBottom: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingLeft: 15,
    paddingRight: 20,
    alignItems: 'center',
    borderTopWidth: 1,
  },
})
