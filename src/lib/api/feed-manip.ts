import {AppBskyFeedFeedViewPost} from '@atproto/api'
type FeedViewPost = AppBskyFeedFeedViewPost.Main

export type FeedTunerFn = (
  tuner: FeedTuner,
  slices: FeedViewPostsSlice[],
) => void

export class FeedViewPostsSlice {
  constructor(public items: FeedViewPost[] = []) {}

  get uri() {
    if (this.isReply) {
      return this.items[1].post.uri
    }
    return this.items[0].post.uri
  }

  get ts() {
    if (this.items[0].reason?.indexedAt) {
      return this.items[0].reason.indexedAt as string
    }
    return this.items[0].post.indexedAt
  }

  get isThread() {
    return (
      this.items.length > 1 &&
      this.items.every(
        item => item.post.author.did === this.items[0].post.author.did,
      )
    )
  }

  get isReply() {
    return this.items.length === 2 && !this.isThread
  }

  get rootItem() {
    if (this.isReply) {
      return this.items[1]
    }
    return this.items[0]
  }

  containsUri(uri: string) {
    return !!this.items.find(item => item.post.uri === uri)
  }

  insert(item: FeedViewPost) {
    const selfReplyUri = getSelfReplyUri(item)
    const i = this.items.findIndex(item2 => item2.post.uri === selfReplyUri)
    if (i !== -1) {
      this.items.splice(i + 1, 0, item)
    } else {
      this.items.push(item)
    }
  }

  flattenReplyParent() {
    if (this.items[0].reply?.parent) {
      this.items.splice(0, 0, {post: this.items[0].reply?.parent})
    }
  }

  logSelf() {
    console.log(
      `- Slice ${this.items.length}${this.isThread ? ' (thread)' : ''} -`,
    )
    for (const item of this.items) {
      console.log(
        `  ${item.reason ? `RP by ${item.reason.by.handle}: ` : ''}${
          item.post.author.handle
        }: ${item.reply ? `(Reply ${item.reply.parent.author.handle}) ` : ''}${
          item.post.record.text
        }`,
      )
    }
  }
}

export class FeedTuner {
  seenUris: Set<string> = new Set()

  constructor() {}

  reset() {
    this.seenUris.clear()
  }

  tune(
    feed: FeedViewPost[],
    tunerFns: FeedTunerFn[] = [],
  ): FeedViewPostsSlice[] {
    const slices: FeedViewPostsSlice[] = []

    // arrange the posts into thread slices
    for (let i = feed.length - 1; i >= 0; i--) {
      const item = feed[i]

      const selfReplyUri = getSelfReplyUri(item)
      if (selfReplyUri) {
        const parent = slices.find(item2 => item2.containsUri(selfReplyUri))
        if (parent) {
          parent.insert(item)
          continue
        }
      }
      slices.unshift(new FeedViewPostsSlice([item]))
    }

    // remove any items already "seen"
    for (let i = slices.length - 1; i >= 0; i--) {
      if (this.seenUris.has(slices[i].uri)) {
        slices.splice(i, 1)
      }
    }

    // turn non-threads with reply parents into threads
    for (const slice of slices) {
      if (
        !slice.isThread &&
        !slice.items[0].reason &&
        slice.items[0].reply?.parent &&
        !this.seenUris.has(slice.items[0].reply?.parent.uri)
      ) {
        slice.flattenReplyParent()
      }
    }

    // sort by slice roots' timestamps
    slices.sort((a, b) => b.ts.localeCompare(a.ts))

    // run the custom tuners
    for (const tunerFn of tunerFns) {
      tunerFn(this, slices)
    }

    for (const slice of slices) {
      for (const item of slice.items) {
        this.seenUris.add(item.post.uri)
      }
      slice.logSelf()
    }

    return slices
  }

  static dedupReposts(tuner: FeedTuner, slices: FeedViewPostsSlice[]) {
    // remove duplicates caused by reposts
    for (let i = 0; i < slices.length; i++) {
      const item1 = slices[i]
      for (let j = i + 1; j < slices.length; j++) {
        const item2 = slices[j]
        if (item2.isThread) {
          // dont dedup items that are rendering in a thread as this can cause rendering errors
          continue
        }
        if (item1.containsUri(item2.items[0].post.uri)) {
          slices.splice(j, 1)
          j--
        }
      }
    }
  }

  static likedRepliesOnly(tuner: FeedTuner, slices: FeedViewPostsSlice[]) {
    // remove any replies without any likes
    for (let i = slices.length - 1; i >= 0; i--) {
      if (slices[i].isThread) {
        continue
      }
      const item = slices[i].rootItem
      const isRepost = Boolean(item.reason)
      if (item.reply && !isRepost && item.post.upvoteCount === 0) {
        slices.splice(i, 1)
      }
    }
  }
}

function getSelfReplyUri(item: FeedViewPost): string | undefined {
  return item.reply?.parent.author.did === item.post.author.did
    ? item.reply?.parent.uri
    : undefined
}
