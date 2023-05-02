import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {ScrollView} from '../com/util/Views'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {ViewHeader} from '../com/util/ViewHeader'
import {Text} from '../com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {ago} from 'lib/strings/time'

export const LogScreen = observer(function Log({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Log'
>) {
  const pal = usePalette('default')
  const store = useStores()
  const [expanded, setExpanded] = React.useState<string[]>([])

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
    }, [store]),
  )

  const toggler = (id: string) => () => {
    if (expanded.includes(id)) {
      setExpanded(expanded.filter(v => v !== id))
    } else {
      setExpanded([...expanded, id])
    }
  }

  return (
    <View style={[s.flex1]}>
      <ViewHeader title="Log" />
      <ScrollView style={s.flex1}>
        {store.log.entries
          .slice(0)
          .reverse()
          .map(entry => {
            return (
              <View key={`entry-${entry.id}`}>
                <TouchableOpacity
                  style={[styles.entry, pal.border, pal.view]}
                  onPress={toggler(entry.id)}
                  accessibilityLabel="View debug entry"
                  accessibilityHint="Opens additional details for a debug entry">
                  {entry.type === 'debug' ? (
                    <FontAwesomeIcon icon="info" />
                  ) : (
                    <FontAwesomeIcon icon="exclamation" style={s.red3} />
                  )}
                  <Text type="sm" style={[styles.summary, pal.text]}>
                    {entry.summary}
                  </Text>
                  {entry.details ? (
                    <FontAwesomeIcon
                      icon={
                        expanded.includes(entry.id) ? 'angle-up' : 'angle-down'
                      }
                      style={s.mr5}
                    />
                  ) : undefined}
                  <Text type="sm" style={[styles.ts, pal.textLight]}>
                    {entry.ts ? ago(entry.ts) : ''}
                  </Text>
                </TouchableOpacity>
                {expanded.includes(entry.id) ? (
                  <View style={[pal.view, s.pl10, s.pr10, s.pb10]}>
                    <View style={[pal.btn, styles.details]}>
                      <Text type="mono" style={pal.text}>
                        {entry.details}
                      </Text>
                    </View>
                  </View>
                ) : undefined}
              </View>
            )
          })}
        <View style={s.footerSpacer} />
      </ScrollView>
    </View>
  )
})

const styles = StyleSheet.create({
  entry: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  summary: {
    flex: 1,
  },
  ts: {
    width: 40,
  },
  details: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
})
