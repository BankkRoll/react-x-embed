/**
 * Regression tests for tweet data derivation, driven by real captured payloads.
 *
 * Every assertion here is anchored to a fixture rather than a hand-written
 * object, so a test failing means the library disagrees with something X
 * actually returned.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { MediaAnimatedGif, MediaVideo } from '../src/api/index.js'
import {
  enrichTweet,
  getHlsVideo,
  getMediaUrl,
  getMp4Video,
  getMp4Videos,
} from '../src/utils.js'
import { byName, fixtures } from './fixtures/index.js'

describe('enrichTweet', () => {
  it('does not throw on any captured shape', () => {
    for (const { name, tweet, covers } of fixtures) {
      assert.doesNotThrow(() => enrichTweet(tweet), `${name} (${covers})`)
    }
  })

  it('derives entities for every fixture without dropping tweet text', () => {
    for (const { name, tweet } of fixtures) {
      const entities = enrichTweet(tweet).entities
      assert.ok(entities.length > 0, `${name} produced no entities`)
      // Every entity must carry the text it covers, or the body renders blank.
      for (const entity of entities) {
        assert.equal(typeof entity.text, 'string', `${name} entity missing text`)
      }
    }
  })

  it('enriches a quoted tweet when one is present', () => {
    // `scam` quotes a tweet that itself has media; `blouu` quotes while also
    // carrying its own photo.
    for (const name of ['scam', 'blouu']) {
      const enriched = enrichTweet(byName(name))
      assert.ok(enriched.quoted_tweet, `${name} lost its quoted tweet`)
      assert.ok(enriched.quoted_tweet.url.startsWith('https://x.com/'))
    }
  })
})

describe('getMp4Video', () => {
  it('returns a playable variant for a real video tweet', () => {
    const media = byName('scubaryan').mediaDetails![0] as MediaVideo
    const video = getMp4Video(media)
    assert.ok(video, 'no variant selected')
    assert.equal(video.content_type, 'video/mp4')
  })

  it('does not return undefined when only HLS variants exist', () => {
    // X serves some videos with an HLS-only variant list. Returning undefined
    // here crashes the player, which dereferences `.url` directly.
    const hlsOnly = {
      video_info: {
        variants: [
          {
            content_type: 'application/x-mpegURL',
            url: 'https://video.twimg.com/x.m3u8',
          },
        ],
      },
    } as unknown as MediaVideo

    const video = getMp4Video(hlsOnly)
    assert.ok(video, 'HLS-only media produced no source; player would crash')
    assert.equal(typeof video.url, 'string')
  })

  it('sorts mp4 variants by descending bitrate', () => {
    const media = byName('scubaryan').mediaDetails![0] as MediaVideo
    const bitrates = getMp4Videos(media).map((v) => v.bitrate ?? 0)
    const descending = [...bitrates].sort((a, b) => b - a)
    assert.deepEqual(bitrates, descending)
  })

  it('selects a rendition matching the requested quality', () => {
    const media = byName('scubaryan').mediaDetails![0] as MediaVideo
    const sorted = getMp4Videos(media)
    assert.ok(sorted.length >= 3, 'fixture should carry several renditions')

    assert.equal(getMp4Video(media, 'high')!.bitrate, sorted[0].bitrate)
    assert.equal(getMp4Video(media, 'medium')!.bitrate, sorted[1].bitrate)
    assert.equal(getMp4Video(media, 'low')!.bitrate, sorted.at(-1)!.bitrate)
  })

  it('tolerates media with no video_info at all', () => {
    const bare = {} as unknown as MediaVideo
    assert.doesNotThrow(() => getMp4Videos(bare))
    assert.equal(getMp4Video(bare), undefined)
  })
})

describe('getHlsVideo', () => {
  it('finds the HLS rendition X ships alongside the mp4s', () => {
    // Safari plays HLS far more reliably than X's mp4 renditions.
    const media = byName('scubaryan').mediaDetails![0] as MediaVideo
    const hls = getHlsVideo(media)
    assert.ok(hls, 'fixture carries an HLS variant')
    assert.equal(hls.content_type, 'application/x-mpegURL')
    assert.ok(hls.url.includes('.m3u8'))
  })
})

describe('getMediaUrl', () => {
  it('builds a format/name parameterised URL for each size', () => {
    const media = byName('fortnite').mediaDetails![0]
    for (const size of ['small', 'medium', 'large'] as const) {
      const url = new URL(getMediaUrl(media, size))
      assert.equal(url.searchParams.get('name'), size)
      assert.ok(url.searchParams.get('format'))
    }
  })
})

describe('captured fixture shapes', () => {
  it('covers the media permutations the renderer branches on', () => {
    const shape = (name: string) =>
      (byName(name).mediaDetails ?? []).map((m) => m.type).join('+')

    assert.equal(shape('coyote'), 'photo+photo+photo+photo')
    assert.equal(shape('scubaryan'), 'video')
    assert.equal(shape('catalog'), 'video+photo')
    assert.equal(shape('scam'), '')
  })
})
