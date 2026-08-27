import type { Metadata, Viewport } from 'next'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import '../../styles/base.css'

export const viewport: Viewport = {
  themeColor: '#fff',
  width: 'device-width',
  initialScale: 1,
}

const siteUrl = 'https://bankkroll.github.io/react-x-embed'

export const metadata: Metadata = {
  title: {
    default: 'react-x-embed',
    template: '%s — react-x-embed',
  },
  description:
    'Embed X (Twitter) posts in React. No API key, no iframe, no client-side JavaScript required.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'react-x-embed',
    title: 'react-x-embed',
    description:
      'Embed X (Twitter) posts in React. No API key, no iframe, no client-side JavaScript required.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'react-x-embed',
    description:
      'Embed X (Twitter) posts in React. No API key, no iframe, no client-side JavaScript required.',
  },
  appleWebApp: {
    title: 'react-x-embed',
  },
  other: {
    'msapplication-TileColor': '#fff',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const navbar = (
  <Navbar
    logo={<b>react-x-embed</b>}
    projectLink="https://github.com/BankkRoll/react-x-embed"
  />
)
const footer = (
  <Footer>
    <div className="flex w-full flex-col items-center sm:items-start">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <a
          className="text-current"
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/BankkRoll/react-x-embed"
        >
          GitHub
        </a>
        <a
          className="text-current"
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.npmjs.com/package/react-x-embed"
        >
          npm
        </a>
        <a
          className="text-current"
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/vercel/react-tweet"
        >
          Upstream
        </a>
      </div>
      <p className="mt-6 text-xs">
        MIT licensed. A fork of{' '}
        <a
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/vercel/react-tweet"
        >
          react-tweet
        </a>
        , originally created by Luis Alvarez at Vercel.
      </p>
    </div>
  </Footer>
)

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
      suppressHydrationWarning
    >
      <Head></Head>
      <body>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/BankkRoll/react-x-embed/tree/main/apps/site/src/content"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
