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

See the [package readme](./packages/react-x-embed/readme.md) for what changed and why, or the [docs](./apps/site/src/content/index.mdx) to get started.

## Repository layout

| Path | Description |
| --- | --- |
| [`packages/react-x-embed`](./packages/react-x-embed) | The library |
| [`apps/site`](./apps/site) | Documentation site |
| [`apps/next-app`](./apps/next-app) | Next.js test app — App Router, Pages Router, SWR, caching |
| [`apps/vite-app`](./apps/vite-app) | Vite test app |
| [`apps/custom-tweet-dub`](./apps/custom-tweet-dub) | Custom theme example |

## Development

```bash
pnpm install
pnpm dev --filter=next-app...   # test app on :3001
pnpm test --filter=react-x-embed
```

Tests run against captured syndication payloads in [`packages/react-x-embed/test/fixtures`](./packages/react-x-embed/test/fixtures), so they need no network access. That directory also holds X's own rendered HTML, CSS, and computed geometry for the same tweets — the reference layout decisions are measured against.

## License

MIT. Originally created by Luis Alvarez at Vercel.
