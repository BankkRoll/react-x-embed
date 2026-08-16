# Custom theme example

A custom theme built on the utilities `react-x-embed` exports, rather than the default Twitter theme. Inspired by the post styling on [dub.sh](https://dub.sh).

```bash
pnpm install
pnpm dev --filter=custom-tweet-dub...
```

The components in [`components/tweet`](./components/tweet) show how to render a post from scratch: fetch with `getTweet`, derive display data with `enrichTweet`, then lay it out however you like.

See the [custom theme guide](../site/src/content/custom-theme.mdx) for a walkthrough.
