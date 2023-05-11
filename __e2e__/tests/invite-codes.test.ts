/* eslint-env detox/detox */

import {openApp, login, createServer} from '../util'

describe('invite-codes', () => {
  let service: string
  let inviteCode = ''
  beforeAll(async () => {
    service = await createServer('?users&invite')
    await openApp({permissions: {notifications: 'YES'}})
  })

  it('I can fetch invite codes', async () => {
    await expect(element(by.id('signInButton'))).toBeVisible()
    await login(service, 'alice', 'hunter2')
    await element(by.id('viewHeaderDrawerBtn')).tap()
    await expect(element(by.id('drawer'))).toBeVisible()
    await element(by.id('menuItemInviteCodes')).tap()
    await expect(element(by.id('inviteCodesModal'))).toBeVisible()
    const attrs = await element(by.id('inviteCode-0-code')).getAttributes()
    inviteCode = attrs.text
    await element(by.id('closeBtn')).tap()
    await element(by.id('viewHeaderDrawerBtn')).tap()
    await element(by.id('menuItemButton-Settings')).tap()
    await element(by.id('signOutBtn')).tap()
  })

  it('I can create a new account with the invite code', async () => {
    await element(by.id('createAccountButton')).tap()
    await device.takeScreenshot('1- opened create account screen')
    await element(by.id('otherServerBtn')).tap()
    await device.takeScreenshot('2- selected other server')
    await element(by.id('customServerInput')).clearText()
    await element(by.id('customServerInput')).typeText(service)
    await device.takeScreenshot('3- input test server URL')
    await element(by.id('nextBtn')).tap()
    await element(by.id('inviteCodeInput')).typeText(inviteCode)
    await element(by.id('emailInput')).typeText('example@test.com')
    await element(by.id('passwordInput')).typeText('hunter2')
    await device.takeScreenshot('4- entered account details')
    await element(by.id('nextBtn')).tap()
    await element(by.id('handleInput')).typeText('e2e-test')
    await device.takeScreenshot('4- entered handle')
    await element(by.id('nextBtn')).tap()
    await expect(element(by.id('homeScreen'))).toBeVisible()
    await element(by.id('viewHeaderDrawerBtn')).tap()
    await element(by.id('menuItemButton-Settings')).tap()
    await element(by.id('signOutBtn')).tap()
  })

  it('I get a notification for the new user', async () => {
    await expect(element(by.id('signInButton'))).toBeVisible()
    await login(service, 'alice', 'hunter2')
    await element(by.id('viewHeaderDrawerBtn')).tap()
    await element(by.id('menuItemButton-Notifications')).tap()
    await expect(element(by.id('invitedUser'))).toBeVisible()
  })

  it('I can dismiss the new user notification', async () => {
    await element(by.id('dismissBtn')).tap()
    await expect(element(by.id('invitedUser'))).not.toBeVisible()
  })
})
