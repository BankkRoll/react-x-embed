import type { Tweet, TweetBase } from './types/index.js'

/**
 * Minimal shape checks for syndication API responses.
 *
 * The API is undocumented and changes without notice. Historically each change
 * surfaced as a crash deep in rendering — `Cannot read properties of undefined
 * (reading 'screen_name')` (#135, #144, #197), `entities is not iterable`
 * (#218) — because the payload was trusted and dereferenced directly.
 *
 * Rather than validate the full schema, this checks only the fields whose
 * absence would throw, so a malformed response degrades to "tweet not found"
 * instead of taking down the page that embedded it.
 */

/** Fields the renderer dereferences without guarding. */
const isTweetUser = (user: unknown): boolean => {
  if (!user || typeof user !== 'object') return false
  const { screen_name, name, profile_image_url_https } = user as Record<string, unknown>
  return (
    typeof screen_name === 'string' &&
    typeof name === 'string' &&
    typeof profile_image_url_https === 'string'
  )
}

const isTweetBase = (tweet: unknown): tweet is TweetBase => {
  if (!tweet || typeof tweet !== 'object') return false
  const { id_str, text, user, display_text_range } = tweet as Record<string, unknown>

  return (
    typeof id_str === 'string' &&
    typeof text === 'string' &&
    isTweetUser(user) &&
    // getEntities slices the tweet text against this range on every render.
    Array.isArray(display_text_range) &&
    display_text_range.length === 2
  )
}

/**
 * Whether a syndication response can be rendered.
 *
 * Deleted and suspended accounts are the common case: X returns a tweet-shaped
 * object with `user` omitted entirely (#144).
 *
 * @example
 * const { data } = await fetchTweet(id)
 * if (!isValidTweet(data)) return <TweetNotFound />
 */
export const isValidTweet = (tweet: unknown): tweet is Tweet => {
  if (!isTweetBase(tweet)) return false

  const { quoted_tweet, parent } = tweet as unknown as Record<string, unknown>

  // A malformed quote or parent would crash the same way the root tweet does,
  // since both are enriched through the same path.
  if (quoted_tweet != null && !isTweetBase(quoted_tweet)) return false
  if (parent != null && !isTweetBase(parent)) return false

  return true
}
