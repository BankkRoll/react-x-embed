import type { MediaDetails } from 'react-x-embed/api'
import {
  type EnrichedTweet,
  getHlsVideo,
  getMediaUrl,
  getMp4Video,
} from 'react-x-embed'
import BlurImage from './blur-image'

export const TweetMedia = ({
  tweet,
  media,
}: {
  tweet: EnrichedTweet
  media: MediaDetails
}) => {
  if (media.type == 'video') {
    const mp4 = getMp4Video(media)
    const hls = getHlsVideo(media)

    return (
      <video
        className="rounded-lg border border-gray-200 drop-shadow-sm"
        loop
        width="2048px"
        height="2048px"
        autoPlay
        muted
        playsInline
      >
        {/* HLS first so Safari, which plays it more reliably than X's mp4
            renditions, picks it up before falling through to the mp4. */}
        {hls && hls.url !== mp4?.url && (
          <source src={hls.url} type={hls.content_type} />
        )}
        {mp4 && <source src={mp4.url} type={mp4.content_type} />}
        Your browser does not support the video tag.
      </video>
    )
  }

  if (media.type == 'animated_gif') {
    const gif = getMp4Video(media)
    // A GIF with no playable rendition has nothing to show.
    if (!gif) return null

    return (
      <BlurImage
        alt={tweet.text}
        width={2048}
        height={media.original_info.height * (2048 / media.original_info.width)}
        src={gif.url}
        className="rounded-lg border border-gray-200 drop-shadow-sm"
      />
    )
  }

  return (
    <BlurImage
      alt={tweet.text}
      width={2048}
      height={media.original_info.height * (2048 / media.original_info.width)}
      src={getMediaUrl(media, 'small')}
      className="rounded-lg border border-gray-200 drop-shadow-sm"
    />
  )
}
