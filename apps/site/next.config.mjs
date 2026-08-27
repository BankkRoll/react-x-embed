import nextra from 'nextra'

const withNextra = nextra({})

// The docs are deployed to GitHub Pages, which serves static files only.
// Project sites live under `/<repo>/`, so assets and links need that prefix;
// a user site or custom domain is served from the root and should set
// `PAGES_BASE_PATH=''` instead.
const basePath = process.env.PAGES_BASE_PATH ?? '/react-x-embed'

export default withNextra({
  output: 'export',
  basePath,
  // `next/image` optimization needs a server; Pages has none.
  images: { unoptimized: true },
  // Emits `about/index.html` rather than `about.html`, so paths resolve
  // without the server-side rewrite Pages can't do.
  trailingSlash: true,
})
