/**
 * Guards the error paths of `fetchTweet`, which are reached far more often than
 * the success path: X answers rate limiting with `text/plain`, deleted tweets
 * with an HTML 404, and upstream failures with an HTML 5xx.
 *
 * Reading `data.error` unguarded threw `Cannot read properties of undefined`
 * for every one of those, replacing the HTTP status with a TypeError — a 429
 * was indistinguishable from a bug and callers had no status to back off on.
 */
import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

import { TwitterApiError, fetchTweet } from '../src/api/fetch-tweet.js'
import { fixtures } from './fixtures/index.js'

/** Stubs global fetch with one response, restoring the original afterwards. */
const withResponse = async (
  { status, contentType, body }: {
    status: number
    contentType: string | null
    body: string
  },
  run: () => Promise<void>
) => {
  const original = globalThis.fetch
  globalThis.fetch = mock.fn(async () =>
    new Response(status === 204 ? null : body, {
      status,
      headers: contentType ? { 'content-type': contentType } : {},
    })
  ) as typeof globalThis.fetch

  try {
    await run()
  } finally {
    globalThis.fetch = original
  }
}

const VALID_ID = '20'

describe('fetchTweet', () => {
  it('rejects ids that are not numeric', async () => {
    await assert.rejects(() => fetchTweet('abc'), /Invalid tweet id/)
    await assert.rejects(() => fetchTweet('1;drop'), /Invalid tweet id/)
    await assert.rejects(() => fetchTweet('1'.repeat(41)), /Invalid tweet id/)
  })

  it('reports a rate-limited response as a 429 rather than a TypeError', async () => {
    // The regression: 429 carries `text/plain`, so `data` is undefined.
    await withResponse(
      { status: 429, contentType: 'text/plain;charset=utf-8', body: 'Rate limit exceeded' },
      async () => {
        const error = await fetchTweet(VALID_ID).then(
          () => null,
          (e) => e
        )
        assert.ok(error instanceof TwitterApiError, `got ${error?.constructor?.name}`)
        assert.equal(error.status, 429)
        assert.match(error.message, /429/)
      }
    )
  })

  it('reports a non-JSON server error as its real status', async () => {
    await withResponse(
      { status: 503, contentType: 'text/html;charset=utf-8', body: '<html>nope</html>' },
      async () => {
        const error = await fetchTweet(VALID_ID).then(
          () => null,
          (e) => e
        )
        assert.ok(error instanceof TwitterApiError)
        assert.equal(error.status, 503)
      }
    )
  })

  it('surfaces the API error message when the body is JSON', async () => {
    // What an out-of-range id actually returns: {"error":"Bad request."}
    await withResponse(
      { status: 400, contentType: 'application/json; charset=utf-8', body: '{"error":"Bad request."}' },
      async () => {
        const error = await fetchTweet(VALID_ID).then(
          () => null,
          (e) => e
        )
        assert.ok(error instanceof TwitterApiError)
        assert.equal(error.status, 400)
        assert.equal(error.message, 'Bad request.')
      }
    )
  })

  it('treats a 404 as not found', async () => {
    // Deleted tweets 404 with an HTML body, so this must not depend on JSON.
    await withResponse(
      { status: 404, contentType: 'text/html;charset=utf-8', body: '<html>X / ?</html>' },
      async () => {
        assert.deepEqual(await fetchTweet(VALID_ID), { notFound: true })
      }
    )
  })

  it('treats an empty payload as not found', async () => {
    // An absent `token` returns `{}` with a 200.
    await withResponse(
      { status: 200, contentType: 'application/json; charset=utf-8', body: '{}' },
      async () => {
        assert.deepEqual(await fetchTweet(VALID_ID), { notFound: true })
      }
    )
  })

  it('reports a tombstone instead of returning it', async () => {
    await withResponse(
      {
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: '{"__typename":"TweetTombstone","tombstone":{"text":{"text":"This Post is unavailable."}}}',
      },
      async () => {
        assert.deepEqual(await fetchTweet(VALID_ID), { tombstone: true })
      }
    )
  })

  it('reports an unrenderable tweet as not found rather than returning it', async () => {
    // Suspended accounts return a tweet-shaped object with no `user` (#144).
    const { user, ...withoutUser } = structuredClone(fixtures[0].tweet) as any
    await withResponse(
      {
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(withoutUser),
      },
      async () => {
        assert.deepEqual(await fetchTweet(VALID_ID), { notFound: true })
      }
    )
  })

  it('returns a valid payload', async () => {
    await withResponse(
      {
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(fixtures[0].tweet),
      },
      async () => {
        const { data } = await fetchTweet(VALID_ID)
        assert.equal(data?.id_str, fixtures[0].tweet.id_str)
      }
    )
  })
})
