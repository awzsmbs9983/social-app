import React, {useCallback} from 'react'
import {observer} from 'mobx-react-lite'
import {Pressable, StyleSheet, View} from 'react-native'
import {AppBskyGraphDefs as GraphDefs} from '@atproto/api'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Text} from '../util/text/Text'
import {UserAvatar} from '../util/UserAvatar'
import {ListsList} from '../lists/ListsList'
import {ListsListModel} from 'state/models/lists/lists-list'
import {ListMembershipModel} from 'state/models/content/list-membership'
import {EmptyStateWithButton} from '../util/EmptyStateWithButton'
import {Button} from '../util/forms/Button'
import * as Toast from '../util/Toast'
import {useStores} from 'state/index'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {isDesktopWeb, isAndroid} from 'platform/detection'

export const snapPoints = ['fullscreen']

export const Component = observer(
  ({
    subject,
    displayName,
    onUpdate,
  }: {
    subject: string
    displayName: string
    onUpdate?: () => void
  }) => {
    const store = useStores()
    const pal = usePalette('default')
    const palPrimary = usePalette('primary')
    const palInverted = usePalette('inverted')
    const [selected, setSelected] = React.useState([])

    const listsList: ListsListModel = React.useMemo(
      () => new ListsListModel(store, store.me.did),
      [store],
    )
    const memberships: ListMembershipModel = React.useMemo(
      () => new ListMembershipModel(store, subject),
      [store, subject],
    )
    React.useEffect(() => {
      listsList.refresh()
      memberships.fetch().then(
        () => {
          setSelected(memberships.memberships.map(m => m.value.list))
        },
        err => {
          store.log.error('Failed to fetch memberships', {err})
        },
      )
    }, [memberships, listsList, store, setSelected])

    const onPressCancel = useCallback(() => {
      store.shell.closeModal()
    }, [store])

    const onPressSave = useCallback(async () => {
      try {
        await memberships.updateTo(selected)
      } catch (err) {
        store.log.error('Failed to update memberships', {err})
        return
      }
      Toast.show('Lists updated')
      onUpdate?.()
      store.shell.closeModal()
    }, [store, selected, memberships, onUpdate])

    const onPressNewMuteList = useCallback(() => {
      store.shell.openModal({
        name: 'create-or-edit-mute-list',
        onSave: (_uri: string) => {
          listsList.refresh()
        },
      })
    }, [store, listsList])

    const onToggleSelected = useCallback(
      (uri: string) => {
        if (selected.includes(uri)) {
          setSelected(selected.filter(uri2 => uri2 !== uri))
        } else {
          setSelected([...selected, uri])
        }
      },
      [selected, setSelected],
    )

    const renderItem = useCallback(
      (list: GraphDefs.ListView) => {
        const isSelected = selected.includes(list.uri)
        return (
          <Pressable
            testID={`toggleBtn-${list.name}`}
            style={[styles.listItem, pal.border]}
            accessibilityLabel={`${isSelected ? 'Remove from' : 'Add to'} ${
              list.name
            }`}
            accessibilityHint=""
            onPress={() => onToggleSelected(list.uri)}>
            <View style={styles.listItemAvi}>
              <UserAvatar size={40} avatar={list.avatar} />
            </View>
            <View style={styles.listItemContent}>
              <Text
                type="lg"
                style={[s.bold, pal.text]}
                numberOfLines={1}
                lineHeight={1.2}>
                {sanitizeDisplayName(list.name)}
              </Text>
              <Text type="md" style={[pal.textLight]} numberOfLines={1}>
                {list.purpose === 'app.bsky.graph.defs#modlist' && 'Mute list'}{' '}
                by{' '}
                {list.creator.did === store.me.did
                  ? 'you'
                  : `@${list.creator.handle}`}
              </Text>
            </View>
            <View
              style={
                isSelected
                  ? [styles.checkbox, palPrimary.border, palPrimary.view]
                  : [styles.checkbox, pal.borderDark]
              }>
              {isSelected && (
                <FontAwesomeIcon
                  icon="check"
                  style={palInverted.text as FontAwesomeIconStyle}
                />
              )}
            </View>
          </Pressable>
        )
      },
      [pal, palPrimary, palInverted, onToggleSelected, selected, store.me.did],
    )

    const renderEmptyState = React.useCallback(() => {
      return (
        <EmptyStateWithButton
          icon="users-slash"
          message="You can subscribe to mute lists to automatically mute all of the users they include. Mute lists are public but your subscription to a mute list is private."
          buttonLabel="New Mute List"
          onPress={onPressNewMuteList}
        />
      )
    }, [onPressNewMuteList])

    return (
      <View testID="listAddRemoveUserModal" style={s.hContentRegion}>
        <Text style={[styles.title, pal.text]}>Add {displayName} to lists</Text>
        <ListsList
          listsList={listsList}
          showAddBtns
          onPressCreateNew={onPressNewMuteList}
          renderItem={renderItem}
          renderEmptyState={renderEmptyState}
          style={[styles.list, pal.border]}
        />
        <View style={[styles.btns, pal.border]}>
          <Button
            testID="cancelBtn"
            type="default"
            onPress={onPressCancel}
            style={styles.footerBtn}
            accessibilityLabel="Cancel"
            accessibilityHint=""
            onAccessibilityEscape={onPressCancel}
            label="Cancel"
          />
          <Button
            testID="saveBtn"
            type="primary"
            onPress={onPressSave}
            style={styles.footerBtn}
            accessibilityLabel="Save changes"
            accessibilityHint=""
            onAccessibilityEscape={onPressSave}
            label="Save Changes"
          />
        </View>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: isDesktopWeb ? 0 : 16,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 10,
  },
  list: {
    flex: 1,
    borderTopWidth: 1,
  },
  btns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 10,
    paddingBottom: isAndroid ? 10 : 0,
    borderTopWidth: 1,
  },
  footerBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  listItemAvi: {
    width: 54,
    paddingLeft: 4,
    paddingTop: 8,
    paddingBottom: 10,
  },
  listItemContent: {
    flex: 1,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 8,
  },
})
