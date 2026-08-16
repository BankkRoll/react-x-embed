import type {
  TweetBase,
  Tweet,
  QuotedTweet,
  MediaDetails,
  HashtagEntity,
  SymbolEntity,
  Indices,
  UserMentionEntity,
  UrlEntity,
  MediaEntity,
  MediaAnimatedGif,
  MediaVideo,
} from './api/index.js'

export { formatDate } from './date-utils.js'

export type TweetCoreProps = {
  id: string
  onError?(error: any): any
}

const getTweetUrl = (tweet: TweetBase) =>
  `https://x.com/${tweet.user.screen_name}/status/${tweet.id_str}`

const getUserUrl = (usernameOrTweet: string | TweetBase) =>
  `https://x.com/${
    typeof usernameOrTweet === 'string'
      ? usernameOrTweet
      : usernameOrTweet.user.screen_name
  }`

const getLikeUrl = (tweet: TweetBase) =>
  `https://x.com/intent/like?tweet_id=${tweet.id_str}`

const getReplyUrl = (tweet: TweetBase) =>
  `https://x.com/intent/tweet?in_reply_to=${tweet.id_str}`

const getFollowUrl = (tweet: TweetBase) =>
  `https://x.com/intent/follow?screen_name=${tweet.user.screen_name}`

const getHashtagUrl = (hashtag: HashtagEntity) =>
  `https://x.com/hashtag/${hashtag.text}`

const getSymbolUrl = (symbol: SymbolEntity) =>
  `https://x.com/search?q=%24${symbol.text}`

const getInReplyToUrl = (tweet: Tweet) =>
  `https://x.com/${tweet.in_reply_to_screen_name}/status/${tweet.in_reply_to_status_id_str}`

export const getMediaUrl = (
  media: MediaDetails,
  size: 'small' | 'medium' | 'large'
): string => {
  const url = new URL(media.media_url_https)
  const extension = url.pathname.split('.').pop()

  if (!extension) return media.media_url_https

  url.pathname = url.pathname.replace(`.${extension}`, '')
  url.searchParams.set('format', extension)
  url.searchParams.set('name', size)

  return url.toString()
}

/** Quality to select when several mp4 renditions are available. */
export type VideoQuality = 'low' | 'medium' | 'high'

const HLS_CONTENT_TYPE = 'application/x-mpegURL'

/**
 * All mp4 renditions of a video, sorted by descending bitrate.
 */
export const getMp4Videos = (media: MediaAnimatedGif | MediaVideo) => {
  const variants = media.video_info?.variants ?? []
  const sortedMp4Videos = variants
    .filter((vid) => vid.content_type === 'video/mp4')
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))

  return sortedMp4Videos
}

/**
 * The HLS (`application/x-mpegURL`) rendition, when X provides one.
 *
 * Safari handles HLS natively and plays it far more reliably than X's mp4
 * renditions, which don't always honour byte-range requests. Offering it as an
 * additional `<source>` lets the browser pick.
 */
export const getHlsVideo = (media: MediaAnimatedGif | MediaVideo) =>
  media.video_info?.variants?.find((vid) => vid.content_type === HLS_CONTENT_TYPE)

/**
 * Picks a single mp4 rendition to play.
 *
 * `medium` (the default) skips the highest bitrate, which is usually far larger
 * than an inline embed needs.
 *
 * NOTE: some videos are served with an HLS-only variant list. Rather than
 * returning `undefined` — which crashed the player, since callers dereference
 * `.url` — this falls back to the HLS rendition.
 */
export const getMp4Video = (
  media: MediaAnimatedGif | MediaVideo,
  quality: VideoQuality = 'medium'
) => {
  const mp4Videos = getMp4Videos(media)

  if (mp4Videos.length === 0) return getHlsVideo(media)
  if (quality === 'high' || mp4Videos.length === 1) return mp4Videos[0]
  if (quality === 'low') return mp4Videos[mp4Videos.length - 1]

  return mp4Videos[1]
}

/**
 * Rewrites a profile image URL to a higher-resolution variant.
 *
 * The syndication API returns the `_normal` rendition, which is 48x48 — blurry
 * on any retina display, since the avatar renders at 48 CSS pixels. `_400x400`
 * is the same asset at 400px.
 *
 * It also sidesteps a class of broken avatars: X purges `_normal` renditions of
 * older assets more aggressively, so tweets predating a user's avatar change
 * can 404 on the URL the API still reports. This is a mitigation rather than a
 * cure — if the whole asset is gone, every rendition 404s.
 *
 * URLs that don't match the expected profile-image shape are returned as-is.
 *
 * @example
 * normalizeAvatarUrl('https://pbs.twimg.com/profile_images/123/abc_normal.jpg')
 * // 'https://pbs.twimg.com/profile_images/123/abc_400x400.jpg'
 */
export const normalizeAvatarUrl = (src: string): string =>
  typeof src === 'string'
    ? src.replace(/(\/profile_images\/.+)_normal(\.\w+)$/, '$1_400x400$2')
    : src

export const formatNumber = (n: number): string => {
  if (n > 999999) return `${(n / 1000000).toFixed(1)}M`
  if (n > 999) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

type TextEntity = {
  indices: Indices
  type: 'text'
}

type TweetEntity =
  | HashtagEntity
  | UserMentionEntity
  | UrlEntity
  | MediaEntity
  | SymbolEntity

type EntityWithType =
  | TextEntity
  | (HashtagEntity & { type: 'hashtag' })
  | (UserMentionEntity & { type: 'mention' })
  | (UrlEntity & { type: 'url' })
  | (MediaEntity & { type: 'media' })
  | (SymbolEntity & { type: 'symbol' })

type Entity = {
  text: string
} & (
  | TextEntity
  | (HashtagEntity & { type: 'hashtag'; href: string })
  | (UserMentionEntity & { type: 'mention'; href: string })
  | (UrlEntity & { type: 'url'; href: string })
  | (MediaEntity & { type: 'media'; href: string })
  | (SymbolEntity & { type: 'symbol'; href: string })
)

function getEntities(tweet: TweetBase): Entity[] {
  const textMap = Array.from(tweet.text)
  const result: EntityWithType[] = [
    { indices: tweet.display_text_range, type: 'text' },
  ]

  const { entities } = tweet
  if (entities) {
    addEntities(result, 'hashtag', entities.hashtags)
    addEntities(result, 'mention', entities.user_mentions)
    addEntities(result, 'url', entities.urls)
    addEntities(result, 'symbol', entities.symbols)
    addEntities(result, 'media', entities.media)
  }
  fixRange(tweet, result)

  return result.map((entity) => {
    const text = textMap.slice(entity.indices[0], entity.indices[1]).join('')
    switch (entity.type) {
      case 'hashtag':
        return Object.assign(entity, { href: getHashtagUrl(entity), text })
      case 'mention':
        return Object.assign(entity, {
          href: getUserUrl(entity.screen_name),
          text,
        })
      case 'url':
      case 'media':
        return Object.assign(entity, {
          href: entity.expanded_url,
          text: entity.display_url,
        })
      case 'symbol':
        return Object.assign(entity, { href: getSymbolUrl(entity), text })
      default:
        return Object.assign(entity, { text })
    }
  })
}

function addEntities(
  result: EntityWithType[],
  type: EntityWithType['type'],
  entities?: TweetEntity[]
) {
  if (!entities?.length) return

  for (const entity of entities) {
    for (const [i, item] of result.entries()) {
      if (
        item.indices[0] > entity.indices[0] ||
        item.indices[1] < entity.indices[1]
      ) {
        continue
      }

      const items = [{ ...entity, type }] as EntityWithType[]

      if (item.indices[0] < entity.indices[0]) {
        items.unshift({
          indices: [item.indices[0], entity.indices[0]],
          type: 'text',
        })
      }
      if (item.indices[1] > entity.indices[1]) {
        items.push({
          indices: [entity.indices[1], item.indices[1]],
          type: 'text',
        })
      }

      result.splice(i, 1, ...items)
      break // Break out of the loop to avoid iterating over the new items
    }
  }
}

/**
 * Update display_text_range to work w/ Array.from
 * Array.from is unicode aware, unlike string.slice()
 */
function fixRange(tweet: TweetBase, entities: EntityWithType[]) {
  const media = tweet.entities?.media
  if (media?.length && media[0].indices[0] < tweet.display_text_range[1]) {
    tweet.display_text_range[1] = media[0].indices[0]
  }
  const lastEntity = entities.at(-1)
  if (lastEntity && lastEntity.indices[1] > tweet.display_text_range[1]) {
    lastEntity.indices[1] = tweet.display_text_range[1]
  }
}

export type EnrichedTweet = Omit<Tweet, 'entities' | 'quoted_tweet'> & {
  url: string
  user: {
    url: string
    follow_url: string
  }
  like_url: string
  reply_url: string
  in_reply_to_url?: string
  entities: Entity[]
  quoted_tweet?: EnrichedQuotedTweet
}

export type EnrichedQuotedTweet = Omit<QuotedTweet, 'entities'> & {
  url: string
  entities: Entity[]
}

/**
 * Enriches a tweet with additional data used to more easily use the tweet in a UI.
 */
export const enrichTweet = (tweet: Tweet): EnrichedTweet => ({
  ...tweet,
  url: getTweetUrl(tweet),
  user: {
    ...tweet.user,
    url: getUserUrl(tweet),
    follow_url: getFollowUrl(tweet),
  },
  like_url: getLikeUrl(tweet),
  reply_url: getReplyUrl(tweet),
  in_reply_to_url: tweet.in_reply_to_screen_name
    ? getInReplyToUrl(tweet)
    : undefined,
  entities: getEntities(tweet),
  quoted_tweet: tweet.quoted_tweet
    ? {
        ...tweet.quoted_tweet,
        url: getTweetUrl(tweet.quoted_tweet),
        entities: getEntities(tweet.quoted_tweet),
      }
    : undefined,
})
