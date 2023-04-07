import notifee, {EventType} from '@notifee/react-native'
import {AppBskyEmbedImages} from '@atproto/api'
import {RootStoreModel} from 'state/models/root-store'
import {NotificationsFeedItemModel} from 'state/models/feeds/notifications'
import {enforceLen} from 'lib/strings/helpers'
import {sanitizeDisplayName} from './strings/display-names'
import {resetToTab} from '../Navigation'

export function init(store: RootStoreModel) {
  store.onUnreadNotifications(count => notifee.setBadgeCount(count))
  store.onPushNotification(displayNotificationFromModel)
  store.onSessionLoaded(() => {
    // request notifications permission once the user has logged in
    notifee.requestPermission()
  })
  notifee.onForegroundEvent(async ({type}: {type: EventType}) => {
    store.log.debug('Notifee foreground event', {type})
    if (type === EventType.PRESS) {
      store.log.debug('User pressed a notifee, opening notifications')
      resetToTab('NotificationsTab')
    }
  })
  notifee.onBackgroundEvent(async _e => {}) // notifee requires this but we handle it with onForegroundEvent
}

export function displayNotification(
  title: string,
  body?: string,
  image?: string,
) {
  const opts: {title: string; body?: string; ios?: any} = {title}
  if (body) {
    opts.body = enforceLen(body, 70, true)
  }
  if (image) {
    opts.ios = {
      attachments: [{url: image}],
    }
  }
  return notifee.displayNotification(opts)
}

export function displayNotificationFromModel(
  notif: NotificationsFeedItemModel,
) {
  let author = sanitizeDisplayName(
    notif.author.displayName || notif.author.handle,
  )
  let title: string
  let body: string = ''
  if (notif.isLike) {
    title = `${author} liked your post`
    body = notif.additionalPost?.thread?.postRecord?.text || ''
  } else if (notif.isRepost) {
    title = `${author} reposted your post`
    body = notif.additionalPost?.thread?.postRecord?.text || ''
  } else if (notif.isMention) {
    title = `${author} mentioned you`
    body = notif.additionalPost?.thread?.postRecord?.text || ''
  } else if (notif.isReply) {
    title = `${author} replied to your post`
    body = notif.additionalPost?.thread?.postRecord?.text || ''
  } else if (notif.isFollow) {
    title = 'New follower!'
    body = `${author} has followed you`
  } else {
    return
  }
  let image
  if (
    AppBskyEmbedImages.isView(notif.additionalPost?.thread?.post.embed) &&
    notif.additionalPost?.thread?.post.embed.images[0]?.thumb
  ) {
    image = notif.additionalPost.thread.post.embed.images[0].thumb
  }
  return displayNotification(title, body, image)
}
