# react-x-embed for Vite

Test app covering `react-x-embed` in a client-rendered Vite app, where posts are fetched with SWR rather than on the server.

```bash
pnpm install
pnpm dev --filter=vite-app...
```

Runs at http://localhost:5173. It also serves an API route from `api/tweet/[tweet].ts`, which is what you should point `apiUrl` at instead of the shared default endpoint.

The package source is imported directly from [`packages/react-x-embed`](../../packages/react-x-embed), so changes are reflected immediately.

See the [Vite guide](../site/src/content/vite.mdx) for usage in your own app.
