# react-x-embed

Embed X (Twitter) posts in React. No API key, no iframe, no client-side JavaScript required.

A fork of [vercel/react-tweet](https://github.com/vercel/react-tweet) that fixes the outstanding crashes, matches X's own embed layout, and renders the data the syndication API returns but upstream ignored.

```bash
pnpm add react-x-embed
```

```tsx
import { Tweet } from 'react-x-embed'

export default function Page() {
  return <Tweet id="1628832338187636740" />
}
```

Fully compatible with React Server Components — tweets render statically, so nothing ships to the client.

## Why this fork

Every change below is anchored to a real payload. The repo ships eight captured syndication responses plus X's own rendered HTML, CSS, and computed geometry for each, so layout decisions are measured against X rather than guessed at.

### Crashes fixed

- **Videos with no mp4 rendition.** `getMp4Video` returned `undefined` and the player dereferenced `.url` on it. Those tweets took down the page.
- **Malformed payloads.** A deleted or suspended account returns a tweet-shaped object with no `user`, which threw `Cannot read properties of undefined (reading 'screen_name')` on the first property access. Responses are now validated before rendering and degrade to the "not found" state. ([#135](https://github.com/vercel/react-tweet/issues/135), [#144](https://github.com/vercel/react-tweet/issues/144), [#197](https://github.com/vercel/react-tweet/issues/197))

### Bugs fixed

- **Video in Safari** ([#191](https://github.com/vercel/react-tweet/issues/191)) — X ships an HLS rendition alongside the mp4s, and Safari plays it far more reliably than X's mp4 endpoints, which don't always honour byte-range requests. It's now offered as a `<source>`, listed first so Safari prefers it.
- **`AbortError` on play** ([#213](https://github.com/vercel/react-tweet/issues/213)) — the click handler resolved the video through `previousSibling`, but hiding the play button re-renders the subtree and could detach that node before `play()` settled. Now resolved through a ref.
- **Portrait media dominating the embed** ([#159](https://github.com/vercel/react-tweet/issues/159)) — a 9:16 video rendered at 177.8% padding, nearly twice as tall as the embed is wide. Capped at 100%, matching X.
- **Blurry and missing avatars** ([#201](https://github.com/vercel/react-tweet/issues/201)) — the API only reports the 48×48 `_normal` rendition, which is soft on retina and the one X purges most aggressively. Upgraded to `_400x400`.
- **Infinite loading state** — `useTweet` reported `isLoading: true` forever when given no `id`, since SWR never fetches without a key. Common with ids from routes that haven't resolved.
- **Build failure in React Router / Vite** ([#206](https://github.com/vercel/react-tweet/issues/206)) — Rollup resolves `export *` through a `'use client'` module inconsistently and reported `useTweet` as missing. Now re-exported by name.
- **Touch targets below WCAG minimum** ([#173](https://github.com/vercel/react-tweet/issues/173)) — the author name, handle and Follow link rendered 20px tall against WCAG 2.2's 24px floor. Measured in Chrome: three failures before, zero after, with no visual change.
- **Unoverridable container styles** ([#192](https://github.com/vercel/react-tweet/issues/192)) — `margin` and `max-width` tied on specificity with consumer utility classes, so source order decided, and consumer CSS usually loads first. Both moved to `:where()` for zero specificity.

### Added

- **Link preview cards.** The syndication API returns a fully populated `card` for any tweet sharing a link — title, description, domain, and up to seven image renditions. Upstream rendered none of it. This was the largest visible gap against X's own embeds.
- **Responsive images.** A `srcset` built from the renditions X advertises, instead of always requesting the 680px one.
- **Colour placeholders.** The dominant colour X computed for each image fills its box while it loads, rather than flashing empty.
- **Withheld media handling.** DMCA takedowns and region blocks still appear in the payload but 404 on fetch; they're filtered instead of rendering broken.
- **Video quality selection.** `getMp4Video(media, 'low' | 'medium' | 'high')` instead of a hardcoded rendition.

## Documentation

Full docs live in [`apps/site`](../../apps/site). Start with the [introduction](../../apps/site/src/content/index.mdx), then the guide for your framework:

- [Next.js](../../apps/site/src/content/next.mdx)
- [Vite](../../apps/site/src/content/vite.mdx)
- [API reference](../../apps/site/src/content/twitter-theme/api-reference.mdx)
- [Custom themes](../../apps/site/src/content/custom-theme.mdx)

## Caching

Rendering a tweet calls X's syndication API. Getting rate limited is hard but possible, particularly if you rely on the default SWR endpoint — it's a shared service this project doesn't operate. Before production, [set up caching and your own API route](../../apps/site/src/content/index.mdx#enabling-cache-for-the-x-api).

## What this cannot do

The syndication API is the only endpoint that works without credentials, and it returns exactly one tweet at a time. Timelines, user profiles, search, threads, and reposts are not reachable — every other endpoint is either credential-gated or returns nothing. A repost also resolves to the original tweet, so it cannot be distinguished from it.

Engagement data is limited to `favorite_count` and `conversation_count`. There is no retweet, reply, quote, bookmark, or view count on the tweet itself.

## Contributing

See the [contributing docs](../../apps/site/src/content/contributing.mdx). Tests run against captured fixtures, so `pnpm test` needs no network access.

## License

MIT. Originally created by Luis Alvarez at Vercel; see [license.md](./license.md).
