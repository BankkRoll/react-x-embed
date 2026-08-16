import type { ReactNode } from 'react'
import clsx from 'clsx'
import s from './layout.module.css'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div data-theme="light">
      <div className={clsx(s.root, 'react-tweet-theme')}>
        <main className={s.main}>{children}</main>
        <footer className={s.footer}>
          <p>🤯 This tweet was statically generated.</p>
        </footer>
      </div>
    </div>
  )
}
