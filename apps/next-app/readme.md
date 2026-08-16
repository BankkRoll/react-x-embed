# react-x-embed for Next.js

Test app covering `react-x-embed` in every Next.js rendering mode.

```bash
pnpm install
pnpm dev --filter=next-app...
```

Runs at http://localhost:3001. Append a post ID to the URL to render it — for example [/light/1628832338187636740](http://localhost:3001/light/1628832338187636740).

| Route | Covers |
| --- | --- |
| `/light/[tweet]` | App Router, React Server Components |
| `/light/suspense/[tweet]` | Streaming with `Suspense` |
| `/light/cache/[tweet]` | Caching with `unstable_cache` |
| `/light/vercel-kv/[tweet]` | Caching with Vercel KV |
| `/light/mdx` | Rendering inside MDX |
| `/dark/[tweet]` | Pages Router |
| `/dark/swr/[tweet]` | Client-side fetching with SWR |

The package source is imported directly from [`packages/react-x-embed`](../../packages/react-x-embed), so changes are reflected immediately.

See the [Next.js guide](../site/src/content/next.mdx) for usage in your own app.
