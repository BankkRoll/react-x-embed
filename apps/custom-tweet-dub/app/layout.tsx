import type { ReactNode } from 'react'
import '../base.css'

// NOTE: typed as a plain function rather than FC. Next 16 generates a
// LayoutProps constraint whose return type allows a Promise, which FC's
// ReactElement return is not assignable to.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <head></head>
      <body>{children}</body>
    </html>
  )
}
