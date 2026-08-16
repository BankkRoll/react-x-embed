import { Fragment } from 'react'
import clsx from 'clsx'
import {
  type EnrichedTweet,
  type EnrichedQuotedTweet,
  getMediaBackgroundColor,
  getMediaSrcSet,
  getMediaUrl,
  isMediaAvailable,
} from '../utils.js'
import { MediaDetails } from '../api/index.js'
import type { TwitterComponents } from './types.js'
import { TweetMediaVideo } from './tweet-media-video.js'
import { MediaImg } from './media-img.js'
import s from './tweet-media.module.css'

/**
 * Tallest a single piece of media renders, as a percentage of the embed width.
 *
 * Matches X's own embed, which caps a lone item at a square box: a 9:16 video
 * would otherwise resolve to 177.8% — nearly twice as tall as the embed is
 * wide — and push the rest of the tweet out of view. Verified against the
 * captured reference embeds in `test/fixtures/*.x-embed.geometry.json`.
 */
const MAX_SINGLE_MEDIA_PADDING = 100

const getSkeletonStyle = (media: MediaDetails, itemCount: number) => {
  let paddingBottom = 56.25 // default of 16x9

  // if we only have 1 item, show at original ratio, capped so portrait media
  // can't dominate the embed
  if (itemCount === 1) {
    const { width, height } = media.original_info ?? {}
    const ratio = width > 0 ? (100 / width) * height : paddingBottom

    paddingBottom = Math.min(ratio, MAX_SINGLE_MEDIA_PADDING)
  }

  // if we have 2 items, double the default to be 16x9 total. Each cell spans
  // half the width, so doubling its padding keeps the whole block at 16x9.
  if (itemCount === 2) paddingBottom = paddingBottom * 2

  return {
    width: media.type === 'photo' ? undefined : 'unset',
    paddingBottom: `${paddingBottom}%`,
  }
}

type Props = {
  tweet: EnrichedTweet | EnrichedQuotedTweet
  components?: TwitterComponents
  quoted?: boolean
}

export const TweetMedia = ({ tweet, components, quoted }: Props) => {
  // Media withheld after publication — DMCA takedowns, region blocks — still
  // appears in the payload, but its URLs 404. Dropping it beats rendering a
  // broken image.
  const mediaDetails = tweet.mediaDetails?.filter(isMediaAvailable)
  const length = mediaDetails?.length ?? 0
  const Img = components?.MediaImg ?? MediaImg
  // Only a full tweet carries the parallel `photos` array holding each image's
  // dominant colour; a quoted tweet doesn't.
  const photos = 'photos' in tweet ? tweet.photos : undefined

  if (!length) return null

  return (
    <div className={clsx(s.root, !quoted && s.rounded)}>
      <div
        className={clsx(
          s.mediaWrapper,
          length > 1 && s.grid2Columns,
          length === 3 && s.grid3,
          length > 4 && s.grid2x2
        )}
      >
        {mediaDetails?.map((media) => (
          <Fragment key={media.media_url_https}>
            {media.type === 'photo' ? (
              <a
                key={media.media_url_https}
                href={tweet.url}
                className={clsx(s.mediaContainer, s.mediaLink)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div
                  className={s.skeleton}
                  style={{
                    ...getSkeletonStyle(media, length),
                    backgroundColor: getMediaBackgroundColor(media, photos),
                  }}
                />
                <Img
                  src={getMediaUrl(media, 'small')}
                  srcSet={getMediaSrcSet(media)}
                  sizes={length > 1 ? '(max-width: 550px) 50vw, 275px' : '550px'}
                  alt={media.ext_alt_text || 'Image'}
                  className={s.image}
                  draggable
                />
              </a>
            ) : (
              <div key={media.media_url_https} className={s.mediaContainer}>
                <div
                  className={s.skeleton}
                  style={{
                    ...getSkeletonStyle(media, length),
                    backgroundColor: getMediaBackgroundColor(media, photos),
                  }}
                />
                <TweetMediaVideo tweet={tweet} media={media} />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
