import clsx from 'clsx'
import type { EnrichedTweet } from '../utils.js'
import s from './tweet-card.module.css'

type Props = {
  tweet: EnrichedTweet
}

/**
 * Preview of a link shared in a tweet.
 *
 * Renders nothing unless the tweet carries a card with a title — the URL is
 * already shown inline in the tweet text, so a card with no metadata adds
 * nothing.
 */
export const TweetCard = ({ tweet }: Props) => {
  const { card } = tweet
  if (!card) return null

  return (
    <a
      className={clsx(s.root, card.large ? s.large : s.compact)}
      href={card.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      {card.image && (
        <div className={s.imageWrapper}>
          <div
            className={s.imageRatio}
            style={{
              paddingBottom: card.large
                ? `${(card.image.height / card.image.width) * 100}%`
                : undefined,
            }}
          />
          <img
            className={s.image}
            src={card.image.url}
            alt={card.image.alt ?? ''}
            draggable
          />
        </div>
      )}
      <div className={s.details}>
        {card.domain && <span className={s.domain}>{card.domain}</span>}
        <span className={s.title}>{card.title}</span>
        {card.description && (
          <span className={s.description}>{card.description}</span>
        )}
      </div>
    </a>
  )
}
