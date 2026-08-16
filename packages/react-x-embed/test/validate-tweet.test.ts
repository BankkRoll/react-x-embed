/**
 * Guards against the crash class that has recurred every time X changed the
 * syndication payload: #135, #144, #197 (missing `user`) and #218 (`entities`
 * not iterable). Each of these took down the embedding page rather than
 * degrading to a "not found" state.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { isValidTweet } from '../src/api/validate-tweet.js'
import { enrichTweet } from '../src/utils.js'
import { fixtures } from './fixtures/index.js'

describe('isValidTweet', () => {
  it('accepts every captured payload', () => {
    for (const { name, tweet, covers } of fixtures) {
      assert.ok(isValidTweet(tweet), `${name} (${covers}) rejected`)
    }
  })

  it('rejects a tweet with no user', () => {
    // Deleted or suspended accounts: X returns a tweet-shaped object with
    // `user` omitted, which crashed getTweetUrl on the first property access.
    const { user, ...withoutUser } = fixtures[0].tweet as any
    assert.equal(isValidTweet(withoutUser), false)
  })

  it('rejects a user missing the fields the renderer dereferences', () => {
    const tweet = structuredClone(fixtures[0].tweet) as any
    delete tweet.user.screen_name
    assert.equal(isValidTweet(tweet), false)
  })

  it('rejects a malformed display_text_range', () => {
    // getEntities slices the tweet text against this on every render.
    const tweet = structuredClone(fixtures[0].tweet) as any
    tweet.display_text_range = null
    assert.equal(isValidTweet(tweet), false)
  })

  it('rejects a malformed quoted tweet or parent', () => {
    for (const key of ['quoted_tweet', 'parent']) {
      const tweet = structuredClone(fixtures[0].tweet) as any
      tweet[key] = { id_str: '1' } // no user, no text
      assert.equal(isValidTweet(tweet), false, `${key} not validated`)
    }
  })

  it('rejects non-objects outright', () => {
    for (const value of [null, undefined, '', 0, [], 'a string']) {
      assert.equal(isValidTweet(value), false, `accepted ${JSON.stringify(value)}`)
    }
  })

  it('accepts a tweet whose entities are missing entirely', () => {
    // #218: X omits entity groups when a tweet has none. That is a valid
    // payload — enrichTweet handles it — so validation must not reject it.
    const tweet = structuredClone(fixtures[0].tweet) as any
    delete tweet.entities
    assert.ok(isValidTweet(tweet))
    assert.doesNotThrow(() => enrichTweet(tweet))
  })

  it('every accepted payload survives enrichment', () => {
    // The contract that makes validation worth having: if it passes here, the
    // renderer will not crash on it.
    for (const { name, tweet } of fixtures) {
      if (!isValidTweet(tweet)) continue
      assert.doesNotThrow(() => enrichTweet(tweet), name)
    }
  })
})
