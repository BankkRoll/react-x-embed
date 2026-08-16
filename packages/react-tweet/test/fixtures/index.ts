/**
 * Real syndication API responses, captured from live tweets.
 *
 * Each fixture pins a distinct response shape that the renderer has to survive.
 * They are checked in deliberately: the X syndication API is undocumented and
 * changes without notice, so these double as a record of what it actually
 * returned at capture time (2026-08-16).
 */
import type { Tweet } from '../../src/api/index.js'

import blouu from './blouu.json' with { type: 'json' }
import catalog from './catalog.json' with { type: 'json' }
import coyote from './coyote.json' with { type: 'json' }
import fortnite from './fortnite.json' with { type: 'json' }
import gk68 from './gk68.json' with { type: 'json' }
import scam from './scam.json' with { type: 'json' }
import scubaryan from './scubaryan.json' with { type: 'json' }

/** A captured fixture plus the shape characteristics it is meant to cover. */
export type Fixture = {
  name: string
  tweet: Tweet
  /** Why this fixture is in the set — the render path it exercises. */
  covers: string
}

export const fixtures: Fixture[] = [
  { name: 'coyote', tweet: coyote as unknown as Tweet, covers: '4 photos, 2x2 grid' },
  { name: 'gk68', tweet: gk68 as unknown as Tweet, covers: '4 photos + note_tweet (Show more)' },
  {
    name: 'fortnite',
    tweet: fortnite as unknown as Tweet,
    covers: '1 photo, Square avatar, Business verified',
  },
  {
    name: 'scubaryan',
    tweet: scubaryan as unknown as Tweet,
    covers: 'video with HLS + 3 mp4 variants',
  },
  {
    name: 'catalog',
    tweet: catalog as unknown as Tweet,
    covers: 'mixed video+photo in one mediaDetails array',
  },
  { name: 'scam', tweet: scam as unknown as Tweet, covers: 'no own media, quoted tweet with photo' },
  { name: 'blouu', tweet: blouu as unknown as Tweet, covers: 'own photo AND a quoted tweet' },
]

export const byName = (name: string): Tweet => {
  const found = fixtures.find((f) => f.name === name)
  if (!found) throw new Error(`Unknown fixture: ${name}`)
  return found.tweet
}
