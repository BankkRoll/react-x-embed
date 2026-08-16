import type {
  CardBindingValue,
  CardImageValue,
  TweetCard,
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
  TweetPhoto,
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
/**
 * Builds a `srcset` for a media item from the renditions X advertises.
 *
 * The renderer requests the `small` (680px wide) rendition, which is soft on
 * any retina display. Offering the wider renditions with their real pixel
 * widths lets the browser choose based on device pixel ratio, and costs
 * nothing on 1x screens.
 *
 * Returns `undefined` when X reports no usable sizes.
 */
export const getMediaSrcSet = (media: MediaDetails): string | undefined => {
  const sizes = media.sizes
  if (!sizes) return undefined

  const entries = (['small', 'medium', 'large'] as const)
    .map((size) => ({ size, width: sizes[size]?.w }))
    .filter((entry): entry is { size: 'small' | 'medium' | 'large'; width: number } =>
      Number.isFinite(entry.width) && (entry.width as number) > 0
    )

  // Duplicate widths (X often reports the same width for medium and large)
  // would make the browser's selection arbitrary.
  const seen = new Set<number>()
  const candidates = entries.filter((entry) => {
    if (seen.has(entry.width)) return false
    seen.add(entry.width)
    return true
  })

  if (candidates.length < 2) return undefined

  return candidates
    .map(({ size, width }) => `${getMediaUrl(media, size)} ${width}w`)
    .join(', ')
}

/**
 * A CSS colour for the placeholder shown while media loads.
 *
 * X computes each image's dominant colour, so the space reserved for it can be
 * filled with something close to the final image instead of an empty box.
 *
 * NOTE: the syndication API reports this on the parallel `photos` array rather
 * than on `mediaDetails`, matched by URL. `mediaDetails[].ext_media_color`
 * exists in the response type but is never populated here, and `photos` omits
 * video entries entirely.
 */
export const getMediaBackgroundColor = (
  media: Pick<MediaDetails, 'media_url_https' | 'ext_media_color'>,
  photos?: TweetPhoto[]
): string | undefined => {
  const rgb =
    media.ext_media_color?.palette?.[0]?.rgb ??
    photos?.find((photo) => photo.url === media.media_url_https)?.backgroundColor

  if (!rgb) return undefined

  const { red, green, blue } = rgb
  if (![red, green, blue].every((c) => Number.isFinite(c))) return undefined

  return `rgb(${red}, ${green}, ${blue})`
}

/**
 * Whether X still serves this media.
 *
 * Media can be withheld after the tweet is published — DMCA takedowns and
 * region blocks both surface here — in which case the URLs 404 and the embed
 * would show a broken image.
 */
export const isMediaAvailable = (media: MediaDetails): boolean =>
  (media.ext_media_availability?.status ?? 'Available') === 'Available'

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

/** A link preview, flattened from a tweet's card bindings into render-ready fields. */
export type EnrichedCard = {
  /** Destination of the shared link — the t.co URL the card points at. */
  url: string
  /** Display domain, e.g. `nextjs.org`. */
  domain?: string
  title?: string
  description?: string
  image?: CardImageValue
  /**
   * Whether X would render this as a wide hero image rather than a small
   * thumbnail beside the text.
   */
  large: boolean
}

const getBindingString = (
  bindings: Record<string, CardBindingValue>,
  key: string
): string | undefined => {
  const value = bindings[key]
  return value?.type === 'STRING' ? value.string_value : undefined
}

/**
 * Picks the smallest card image that still covers the embed's width.
 *
 * X ships up to seven renditions of the same asset; `_original` can be
 * 1600x900, which is far more than a ~500px embed needs.
 */
const getBindingImage = (
  bindings: Record<string, CardBindingValue>,
  keys: string[]
): CardImageValue | undefined => {
  for (const key of keys) {
    const value = bindings[key]
    if (value?.type === 'IMAGE' && value.image_value?.url) {
      return value.image_value
    }
  }
  return undefined
}

/**
 * Flattens a tweet's card into the handful of fields needed to render a link
 * preview, or returns `undefined` when there's nothing worth showing.
 *
 * X models cards as an untyped `binding_values` bag whose keys vary by card
 * type, so this reads defensively and treats every field as optional. Cards
 * without a title (`player`, `unified_card`, and X's various ad formats) are
 * skipped — the link is already rendered inline in the tweet text.
 */
export const enrichCard = (card?: TweetCard): EnrichedCard | undefined => {
  if (!card?.binding_values) return undefined

  const bindings = card.binding_values
  const title = getBindingString(bindings, 'title')
  if (!title) return undefined

  const large = card.name === 'summary_large_image' || card.name === 'photo'

  return {
    url: getBindingString(bindings, 'card_url') ?? card.url,
    domain: getBindingString(bindings, 'vanity_url') ?? getBindingString(bindings, 'domain'),
    title,
    description: getBindingString(bindings, 'description'),
    image: getBindingImage(
      bindings,
      large
        ? ['summary_photo_image', 'photo_image_full_size', 'thumbnail_image_large']
        : ['thumbnail_image', 'summary_photo_image_small', 'photo_image_full_size_small']
    ),
    large,
  }
}

export type EnrichedTweet = Omit<Tweet, 'entities' | 'quoted_tweet' | 'card'> & {
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
  card?: EnrichedCard
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
  card: enrichCard(tweet.card),
  quoted_tweet: tweet.quoted_tweet
    ? {
        ...tweet.quoted_tweet,
        url: getTweetUrl(tweet.quoted_tweet),
        entities: getEntities(tweet.quoted_tweet),
      }
    : undefined,
})
