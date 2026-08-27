'use client'

import { useState, type FormEvent } from 'react'
import { Tweet } from 'react-x-embed'
import styles from './tweet-playground.module.css'

const DEFAULT_ID = '1628832338187636740'

/** Pulls the numeric id out of a post URL, or passes a bare id through. */
const parseId = (input: string): string | null => {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^\d{1,40}$/.test(trimmed)) return trimmed

  // https://x.com/<user>/status/<id>, with or without query or trailing slash.
  const match = trimmed.match(/(?:twitter|x)\.com\/[^/]+\/status(?:es)?\/(\d+)/i)
  return match ? match[1] : null
}

/**
 * Live demo: renders a post entirely in the browser via SWR, so it works on a
 * static host with no server. Deliberately does not pass `apiUrl` — it falls
 * back to the public endpoint, which is the zero-config path a reader gets.
 */
export const TweetPlayground = () => {
  const [input, setInput] = useState(DEFAULT_ID)
  const [id, setId] = useState(DEFAULT_ID)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const parsed = parseId(input)

    if (!parsed) {
      setError('Enter a post URL or a numeric post ID.')
      return
    }

    setError(null)
    setId(parsed)
  }

  return (
    <div className={styles.root}>
      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.label} htmlFor="tweet-id">
          Post URL or ID
        </label>
        <div className={styles.row}>
          <input
            id="tweet-id"
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://x.com/vercel/status/1628832338187636740"
            spellCheck={false}
            autoComplete="off"
          />
          <button className={styles.button} type="submit">
            Render
          </button>
        </div>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <div className={styles.preview}>
        {/* `key` forces a remount so the skeleton shows on each new id rather
            than holding the previous post until the next one resolves. */}
        <Tweet key={id} id={id} />
      </div>
    </div>
  )
}
