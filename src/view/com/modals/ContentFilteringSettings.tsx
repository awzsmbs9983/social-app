import React from 'react'
import {StyleSheet, Pressable, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {observer} from 'mobx-react-lite'
import {ScrollView} from './util'
import {useStores} from 'state/index'
import {LabelPreference} from 'state/models/ui/preferences'
import {s, colors, gradients} from 'lib/styles'
import {Text} from '../util/text/Text'
import {TextLink} from '../util/Link'
import {ToggleButton} from '../util/forms/ToggleButton'
import {Button} from '../util/forms/Button'
import {usePalette} from 'lib/hooks/usePalette'
import {CONFIGURABLE_LABEL_GROUPS} from 'lib/labeling/const'
import {isIOS} from 'platform/detection'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import * as Toast from '../util/Toast'
import {logger} from '#/logger'

export const snapPoints = ['90%']

export const Component = observer(
  function ContentFilteringSettingsImpl({}: {}) {
    const store = useStores()
    const {isMobile} = useWebMediaQueries()
    const pal = usePalette('default')

    React.useEffect(() => {
      store.preferences.sync()
    }, [store])

    const onPressDone = React.useCallback(() => {
      store.shell.closeModal()
    }, [store])

    return (
      <View testID="contentFilteringModal" style={[pal.view, styles.container]}>
        <Text style={[pal.text, styles.title]}>Content Filtering</Text>
        <ScrollView style={styles.scrollContainer}>
          <AdultContentEnabledPref />
          <ContentLabelPref
            group="nsfw"
            disabled={!store.preferences.adultContentEnabled}
          />
          <ContentLabelPref
            group="nudity"
            disabled={!store.preferences.adultContentEnabled}
          />
          <ContentLabelPref
            group="suggestive"
            disabled={!store.preferences.adultContentEnabled}
          />
          <ContentLabelPref
            group="gore"
            disabled={!store.preferences.adultContentEnabled}
          />
          <ContentLabelPref group="hate" />
          <ContentLabelPref group="spam" />
          <ContentLabelPref group="impersonation" />
          <View style={{height: isMobile ? 60 : 0}} />
        </ScrollView>
        <View
          style={[
            styles.btnContainer,
            isMobile && styles.btnContainerMobile,
            pal.borderDark,
          ]}>
          <Pressable
            testID="sendReportBtn"
            onPress={onPressDone}
            accessibilityRole="button"
            accessibilityLabel="Done"
            accessibilityHint="">
            <LinearGradient
              colors={[gradients.blueLight.start, gradients.blueLight.end]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[styles.btn]}>
              <Text style={[s.white, s.bold, s.f18]}>Done</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    )
  },
)

const AdultContentEnabledPref = observer(
  function AdultContentEnabledPrefImpl() {
    const store = useStores()
    const pal = usePalette('default')

    const onSetAge = () => store.shell.openModal({name: 'birth-date-settings'})

    const onToggleAdultContent = async () => {
      if (isIOS) {
        return
      }
      try {
        await store.preferences.setAdultContentEnabled(
          !store.preferences.adultContentEnabled,
        )
      } catch (e) {
        Toast.show(
          'There was an issue syncing your preferences with the server',
        )
        logger.error('Failed to update preferences with server', {error: e})
      }
    }

    return (
      <View style={s.mb10}>
        {isIOS ? (
          store.preferences.adultContentEnabled ? null : (
            <Text type="md" style={pal.textLight}>
              Adult content can only be enabled via the Web at{' '}
              <TextLink
                style={pal.link}
                href="https://bsky.app"
                text="bsky.app"
              />
              .
            </Text>
          )
        ) : typeof store.preferences.birthDate === 'undefined' ? (
          <View style={[pal.viewLight, styles.agePrompt]}>
            <Text type="md" style={[pal.text, {flex: 1}]}>
              Confirm your age to enable adult content.
            </Text>
            <Button type="primary" label="Set Age" onPress={onSetAge} />
          </View>
        ) : (store.preferences.userAge || 0) >= 18 ? (
          <ToggleButton
            type="default-light"
            label="Enable Adult Content"
            isSelected={store.preferences.adultContentEnabled}
            onPress={onToggleAdultContent}
            style={styles.toggleBtn}
          />
        ) : (
          <View style={[pal.viewLight, styles.agePrompt]}>
            <Text type="md" style={[pal.text, {flex: 1}]}>
              You must be 18 or older to enable adult content.
            </Text>
            <Button type="primary" label="Set Age" onPress={onSetAge} />
          </View>
        )}
      </View>
    )
  },
)

// TODO: Refactor this component to pass labels down to each tab
const ContentLabelPref = observer(function ContentLabelPrefImpl({
  group,
  disabled,
}: {
  group: keyof typeof CONFIGURABLE_LABEL_GROUPS
  disabled?: boolean
}) {
  const store = useStores()
  const pal = usePalette('default')

  const onChange = React.useCallback(
    async (v: LabelPreference) => {
      try {
        await store.preferences.setContentLabelPref(group, v)
      } catch (e) {
        Toast.show(
          'There was an issue syncing your preferences with the server',
        )
        logger.error('Failed to update preferences with server', {error: e})
      }
    },
    [store, group],
  )

  return (
    <View style={[styles.contentLabelPref, pal.border]}>
      <View style={s.flex1}>
        <Text type="md-medium" style={[pal.text]}>
          {CONFIGURABLE_LABEL_GROUPS[group].title}
        </Text>
        {typeof CONFIGURABLE_LABEL_GROUPS[group].subtitle === 'string' && (
          <Text type="sm" style={[pal.textLight]}>
            {CONFIGURABLE_LABEL_GROUPS[group].subtitle}
          </Text>
        )}
      </View>
      {disabled ? (
        <Text type="sm-bold" style={pal.textLight}>
          Hide
        </Text>
      ) : (
        <SelectGroup
          current={store.preferences.contentLabels[group]}
          onChange={onChange}
          group={group}
        />
      )}
    </View>
  )
})

interface SelectGroupProps {
  current: LabelPreference
  onChange: (v: LabelPreference) => void
  group: keyof typeof CONFIGURABLE_LABEL_GROUPS
}

function SelectGroup({current, onChange, group}: SelectGroupProps) {
  return (
    <View style={styles.selectableBtns}>
      <SelectableBtn
        current={current}
        value="hide"
        label="Hide"
        left
        onChange={onChange}
        group={group}
      />
      <SelectableBtn
        current={current}
        value="warn"
        label="Warn"
        onChange={onChange}
        group={group}
      />
      <SelectableBtn
        current={current}
        value="ignore"
        label="Show"
        right
        onChange={onChange}
        group={group}
      />
    </View>
  )
}

interface SelectableBtnProps {
  current: string
  value: LabelPreference
  label: string
  left?: boolean
  right?: boolean
  onChange: (v: LabelPreference) => void
  group: keyof typeof CONFIGURABLE_LABEL_GROUPS
}

function SelectableBtn({
  current,
  value,
  label,
  left,
  right,
  onChange,
  group,
}: SelectableBtnProps) {
  const pal = usePalette('default')
  const palPrimary = usePalette('inverted')
  return (
    <Pressable
      style={[
        styles.selectableBtn,
        left && styles.selectableBtnLeft,
        right && styles.selectableBtnRight,
        pal.border,
        current === value ? palPrimary.view : pal.view,
      ]}
      onPress={() => onChange(value)}
      accessibilityRole="button"
      accessibilityLabel={value}
      accessibilityHint={`Set ${value} for ${group} content moderation policy`}>
      <Text style={current === value ? palPrimary.text : pal.text}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 12,
  },
  description: {
    paddingHorizontal: 2,
    marginBottom: 10,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  btnContainer: {
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  btnContainerMobile: {
    paddingBottom: 40,
    borderTopWidth: 1,
  },

  agePrompt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },

  contentLabelPref: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    paddingLeft: 4,
    marginBottom: 14,
    borderTopWidth: 1,
  },

  selectableBtns: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  selectableBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderLeftWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  selectableBtnLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderLeftWidth: 1,
  },
  selectableBtnRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.gray1,
  },
  toggleBtn: {
    paddingHorizontal: 0,
  },
})
