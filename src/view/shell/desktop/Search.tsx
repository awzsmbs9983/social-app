import React from 'react'
import {TextInput, View, StyleSheet, TouchableOpacity} from 'react-native'
import {UserAutocompleteViewModel} from 'state/models/user-autocomplete-view'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {MagnifyingGlassIcon2} from 'lib/icons'
import {ProfileCard} from 'view/com/profile/ProfileCard'
import {Text} from 'view/com/util/text/Text'

export const DesktopSearch = observer(function DesktopSearch() {
  const store = useStores()
  const pal = usePalette('default')
  const textInput = React.useRef<TextInput>(null)
  const [isInputFocused, setIsInputFocused] = React.useState<boolean>(false)
  const [query, setQuery] = React.useState<string>('')
  const autocompleteView = React.useMemo<UserAutocompleteViewModel>(
    () => new UserAutocompleteViewModel(store),
    [store],
  )

  const onChangeQuery = (text: string) => {
    setQuery(text)
    if (text.length > 0 && isInputFocused) {
      autocompleteView.setActive(true)
      autocompleteView.setPrefix(text)
    } else {
      autocompleteView.setActive(false)
    }
  }

  const onPressCancelSearch = () => {
    setQuery('')
    autocompleteView.setActive(false)
  }

  return (
    <View style={styles.container}>
      <View
        style={[{backgroundColor: pal.colors.backgroundLight}, styles.search]}>
        <View style={[styles.inputContainer]}>
          <MagnifyingGlassIcon2
            size={18}
            style={[pal.textLight, styles.iconWrapper]}
          />
          <TextInput
            testID="searchTextInput"
            ref={textInput}
            placeholder="Search"
            placeholderTextColor={pal.colors.textLight}
            selectTextOnFocus
            returnKeyType="search"
            value={query}
            style={[pal.textLight, styles.input]}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onChangeText={onChangeQuery}
          />
          {query ? (
            <View style={styles.cancelBtn}>
              <TouchableOpacity onPress={onPressCancelSearch}>
                <Text type="lg" style={[pal.link]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          ) : undefined}
        </View>
      </View>

      {query !== '' && (
        <View style={[pal.view, pal.borderDark, styles.resultsContainer]}>
          {autocompleteView.searchRes.length ? (
            <>
              {autocompleteView.searchRes.map((item, i) => (
                <ProfileCard
                  key={item.did}
                  handle={item.handle}
                  displayName={item.displayName}
                  avatar={item.avatar}
                  noBorder={i === 0}
                />
              ))}
            </>
          ) : (
            <View>
              <Text style={[pal.textLight, styles.noResults]}>
                No results found for {autocompleteView.prefix}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 300,
  },
  search: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    width: 300,
    borderRadius: 20,
  },
  inputContainer: {
    flexDirection: 'row',
  },
  iconWrapper: {
    position: 'relative',
    top: 2,
    paddingVertical: 7,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    width: '100%',
    paddingTop: 7,
    paddingBottom: 7,
  },
  cancelBtn: {
    paddingRight: 4,
    paddingLeft: 10,
    paddingVertical: 7,
  },
  resultsContainer: {
    // @ts-ignore supported by web
    position: 'fixed',
    marginTop: 40,

    flexDirection: 'column',
    width: 300,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
  },
  noResults: {
    textAlign: 'center',
    paddingVertical: 10,
  },
})
