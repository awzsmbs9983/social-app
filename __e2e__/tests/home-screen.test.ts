/* eslint-env detox/detox */

import {openApp, login, createServer} from '../util'

describe('Home screen', () => {
  let service: string
  beforeAll(async () => {
    service = await createServer('?users&follows&posts')
    await openApp({permissions: {notifications: 'YES'}})
  })

  it('Login', async () => {
    await login(service, 'alice', 'hunter2')
    await element(by.id('homeScreenFeedTabs-Following')).tap()
  })

  it('Can like posts', async () => {
    const carlaPosts = by.id('feedItem-by-carla.test')
    await expect(
      element(by.id('likeCount').withAncestor(carlaPosts)).atIndex(0),
    ).toHaveText('0')
    await element(by.id('likeBtn').withAncestor(carlaPosts)).atIndex(0).tap()
    await expect(
      element(by.id('likeCount').withAncestor(carlaPosts)).atIndex(0),
    ).toHaveText('1')
    await element(by.id('likeBtn').withAncestor(carlaPosts)).atIndex(0).tap()
    await expect(
      element(by.id('likeCount').withAncestor(carlaPosts)).atIndex(0),
    ).toHaveText('0')
  })

  it('Can repost posts', async () => {
    const carlaPosts = by.id('feedItem-by-carla.test')
    await expect(
      element(by.id('repostCount').withAncestor(carlaPosts)).atIndex(0),
    ).toHaveText('0')
    await element(by.id('repostBtn').withAncestor(carlaPosts)).atIndex(0).tap()
    await expect(element(by.id('repostModal'))).toBeVisible()
    await element(by.id('repostBtn').withAncestor(by.id('repostModal'))).tap()
    await expect(element(by.id('repostModal'))).not.toBeVisible()
    await expect(
      element(by.id('repostCount').withAncestor(carlaPosts)).atIndex(0),
    ).toHaveText('1')
    await element(by.id('repostBtn').withAncestor(carlaPosts)).atIndex(0).tap()
    await expect(element(by.id('repostModal'))).toBeVisible()
    await element(by.id('repostBtn').withAncestor(by.id('repostModal'))).tap()
    await expect(element(by.id('repostModal'))).not.toBeVisible()
    await expect(
      element(by.id('repostCount').withAncestor(carlaPosts)).atIndex(0),
    ).toHaveText('0')
  })

  it('Can report posts', async () => {
    const carlaPosts = by.id('feedItem-by-carla.test')
    await element(by.id('postDropdownBtn').withAncestor(carlaPosts))
      .atIndex(0)
      .tap()
    await element(by.id('postDropdownReportBtn')).tap()
    await expect(element(by.id('reportPostModal'))).toBeVisible()
    await element(
      by.id('reportPostRadios-com.atproto.moderation.defs#reasonSpam'),
    ).tap()
    await element(by.id('sendReportBtn')).tap()
    await expect(element(by.id('reportPostModal'))).not.toBeVisible()
  })

  it('Can swipe between feeds', async () => {
    await element(by.id('homeScreen')).swipe('left', 'fast', 0.75)
    await expect(element(by.id('whatshotFeedPage'))).toBeVisible()
    await element(by.id('homeScreen')).swipe('right', 'fast', 0.75)
    await expect(element(by.id('followingFeedPage'))).toBeVisible()
  })

  it('Can tap between feeds', async () => {
    await element(by.id("homeScreenFeedTabs-What's hot")).tap()
    await expect(element(by.id('whatshotFeedPage'))).toBeVisible()
    await element(by.id('homeScreenFeedTabs-Following')).tap()
    await expect(element(by.id('followingFeedPage'))).toBeVisible()
  })

  it('Can delete posts', async () => {
    const alicePosts = by.id('feedItem-by-alice.test')
    await expect(element(alicePosts.withDescendant(by.text('Post')))).toExist()
    await element(by.id('postDropdownBtn').withAncestor(alicePosts))
      .atIndex(0)
      .tap()
    await element(by.id('postDropdownDeleteBtn')).tap()
    await expect(element(by.id('confirmModal'))).toBeVisible()
    await element(by.id('confirmBtn')).tap()
    await expect(
      element(alicePosts.withDescendant(by.text('Post'))),
    ).not.toExist()
  })
})
