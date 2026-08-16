/**
 * Regression tests for tweet data derivation, driven by real captured payloads.
 *
 * Every assertion here is anchored to a fixture rather than a hand-written
 * object, so a test failing means the library disagrees with something X
 * actually returned.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { MediaDetails, MediaVideo } from '../src/api/index.js'
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

describe('media aspect ratios', () => {
  // Mirrors getSkeletonStyle in twitter-theme/tweet-media.tsx.
  const paddingFor = (media: MediaDetails, itemCount: number) => {
    let paddingBottom = 56.25
    if (itemCount === 1) {
      const { width, height } = media.original_info ?? ({} as any)
      const ratio = width > 0 ? (100 / width) * height : paddingBottom
      paddingBottom = Math.min(ratio, 100)
    }
    if (itemCount === 2) paddingBottom = paddingBottom * 2
    return paddingBottom
  }

  it('caps a lone portrait video instead of letting it dominate the embed', () => {
    // catalog's video is 720x1280 — 177.8% at natural ratio. X renders its own
    // embed at 113%, so anything approaching 177% is far too tall.
    const video = byName('catalog').mediaDetails!.find((m) => m.type === 'video')!
    const { width, height } = video.original_info
    assert.ok((100 / width) * height > 170, 'fixture should be strongly portrait')
    assert.equal(paddingFor(video, 1), 100)
  })

  it('leaves landscape media at its natural ratio', () => {
    // fortnite is 1920x1080; X renders it at 56.3%.
    const photo = byName('fortnite').mediaDetails![0]
    assert.equal(paddingFor(photo, 1).toFixed(1), '56.3')
  })

  it('keeps multi-item grids at 16x9 overall', () => {
    // Each cell of a 2-up grid is half the width, so doubling the cell padding
    // resolves the block back to 16x9 — matching X's 56.1% measured cells.
    const [first] = byName('catalog').mediaDetails!
    assert.equal(paddingFor(first, 2), 112.5)

    const grid = byName('coyote').mediaDetails!
    assert.equal(paddingFor(grid[0], grid.length), 56.25)
  })

  it('falls back to 16x9 when original_info is missing', () => {
    const bare = { type: 'photo' } as unknown as MediaDetails
    assert.equal(paddingFor(bare, 1), 56.25)
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
