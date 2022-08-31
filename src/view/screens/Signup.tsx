import React from 'react'
import {Text, View} from 'react-native'
import {observer} from 'mobx-react-lite'
// import {useStores} from '../../state'

export const Signup = observer(
  (/*{navigation}: RootTabsScreenProps<'Signup'>*/) => {
    // const store = useStores()
    return (
      <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Create Account</Text>
        {/*store.session.uiError ?? <Text>{store.session.uiError}</Text>}
          {!store.session.uiIsProcessing ? (
            <>
              <Button
                title="Create new account"
                onPress={() => store.session.login()}
              />
              <Button
                title="Log in to an existing account"
                onPress={() => navigation.navigate('Login')}
              />
            </>
          ) : (
            <ActivityIndicator />
          )*/}
      </View>
    )
  },
)
