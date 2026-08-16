/**
 * Renders every captured payload through the real component tree.
 *
 * The unit tests cover the data layer in isolation; these catch crashes that
 * only appear once the components dereference that data — the failure mode
 * behind #135, #144, #197 and #218.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { EmbeddedTweet } from '../src/twitter-theme/embedded-tweet.js'
import { byName, fixtures } from './fixtures/index.js'

const render = (name: string) =>
  renderToStaticMarkup(createElement(EmbeddedTweet, { tweet: byName(name) }))

describe('EmbeddedTweet', () => {
  it('renders every captured shape without throwing', () => {
    for (const { name, covers } of fixtures) {
      assert.doesNotThrow(() => render(name), `${name} (${covers})`)
    }
  })

  it('renders the author and tweet text', () => {
    const html = render('fortnite')
    assert.ok(html.includes('Fortnite'))
    assert.ok(html.includes('x.com/Fortnite/status/'))
  })

  it('offers both HLS and mp4 sources for video', () => {
    // Safari plays X's mp4 renditions unreliably; HLS is listed first so it
    // wins where supported. (#191)
    const html = render('scubaryan')
    assert.ok(html.includes('application/x-mpegURL'), 'no HLS source')
    assert.ok(html.includes('video/mp4'), 'no mp4 source')
    assert.ok(
      html.indexOf('x-mpegURL') < html.indexOf('video/mp4'),
      'HLS must precede mp4 for Safari to prefer it'
    )
  })

  it('caps a portrait video rather than letting it dominate', () => {
    // catalog's video is 720x1280 — 177.8% at natural ratio. (#159)
    const html = render('catalog')
    assert.ok(!/padding-bottom:1[3-9]\d/.test(html), 'media rendered over 130% tall')
  })

  it('serves responsive images with a colour placeholder', () => {
    const html = render('coyote')
    assert.ok(/srcSet|srcset/.test(html), 'no srcset')
    assert.ok(/background-color:rgb\(/.test(html), 'no placeholder colour')
  })

  it('renders a link preview when the tweet carries a card', () => {
    const html = render('card')
    assert.ok(html.includes('Next.js 13.2'), 'card title missing')
    assert.ok(html.includes('nextjs.org'), 'card domain missing')
    assert.ok(html.includes('card_img'), 'card image missing')
  })

  it('renders quoted tweets, with or without media of its own', () => {
    assert.ok(render('scam').includes('x.com/'), 'quoted tweet lost')
    assert.ok(render('blouu').includes('x.com/'), 'quoted tweet lost')
  })

  it('shows a Show more link for truncated note tweets', () => {
    assert.ok(/[Ss]how more/.test(render('gk68')))
  })
})
