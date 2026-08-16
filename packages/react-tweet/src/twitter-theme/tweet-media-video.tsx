'use client'

import { useRef, useState } from 'react'
import clsx from 'clsx'
import type { MediaAnimatedGif, MediaVideo } from '../api/index.js'
import {
  EnrichedQuotedTweet,
  type EnrichedTweet,
  getHlsVideo,
  getMediaUrl,
  getMp4Video,
  type VideoQuality,
} from '../utils.js'
import mediaStyles from './tweet-media.module.css'
import s from './tweet-media-video.module.css'

type Props = {
  tweet: EnrichedTweet | EnrichedQuotedTweet
  media: MediaAnimatedGif | MediaVideo
  /** Which mp4 rendition to play when several are available. Defaults to `medium`. */
  quality?: VideoQuality
}

export const TweetMediaVideo = ({ tweet, media, quality }: Props) => {
  const [playButton, setPlayButton] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [ended, setEnded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mp4Video = getMp4Video(media, quality)
  const hlsVideo = getHlsVideo(media)
  let timeout = 0

  return (
    <>
      <video
        ref={videoRef}
        className={mediaStyles.image}
        poster={getMediaUrl(media, 'small')}
        controls={!playButton}
        playsInline
        preload="none"
        tabIndex={playButton ? -1 : 0}
        onPlay={() => {
          if (timeout) window.clearTimeout(timeout)
          if (!isPlaying) setIsPlaying(true)
          if (ended) setEnded(false)
        }}
        onPause={() => {
          // When the video is seeked (moved to a different timestamp), it will pause for a moment
          // before resuming. We don't want to show the message in that case so we wait a bit.
          if (timeout) window.clearTimeout(timeout)
          timeout = window.setTimeout(() => {
            if (isPlaying) setIsPlaying(false)
            timeout = 0
          }, 100)
        }}
        onEnded={() => {
          setEnded(true)
        }}
      >
        {/*
          HLS is listed first so Safari — which supports it natively and plays
          it more reliably than X's mp4 renditions — picks it up. Browsers
          without HLS support skip to the mp4 source below.
        */}
        {hlsVideo && hlsVideo.url !== mp4Video?.url && (
          <source src={hlsVideo.url} type={hlsVideo.content_type} />
        )}
        {mp4Video && <source src={mp4Video.url} type={mp4Video.content_type} />}
      </video>

      {playButton && (
        <button
          type="button"
          className={s.videoButton}
          aria-label="View video on X"
          onClick={(e) => {
            // NOTE: resolve the element through a ref, not `previousSibling`.
            // Hiding the play button re-renders this subtree, and a node
            // captured beforehand can be detached by the time `play()` settles,
            // which rejects with "The play() request was interrupted because
            // the media was removed from the document".
            const video = videoRef.current
            if (!video) return

            e.preventDefault()
            setPlayButton(false)
            video.load()
            video
              .play()
              .then(() => {
                setIsPlaying(true)
                video.focus()
              })
              .catch((error) => {
                // The element being torn down mid-play is expected during
                // Strict Mode double-invocation and on unmount; it isn't a
                // playback failure worth surfacing or reverting the UI for.
                if (error?.name === 'AbortError') return

                console.error('Error playing video:', error)
                setPlayButton(true)
                setIsPlaying(false)
              })
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className={s.videoButtonIcon}
            aria-hidden="true"
          >
            <g>
              <path d="M21 12L4 2v20l17-10z"></path>
            </g>
          </svg>
        </button>
      )}

      {!isPlaying && !ended && (
        <div className={s.watchOnTwitter}>
          <a
            href={tweet.url}
            className={s.anchor}
            target="_blank"
            rel="noopener noreferrer"
          >
            {playButton ? 'Watch on X' : 'Continue watching on X'}
          </a>
        </div>
      )}

      {ended && (
        <a
          href={tweet.url}
          className={clsx(s.anchor, s.viewReplies)}
          target="_blank"
          rel="noopener noreferrer"
        >
          View replies
        </a>
      )}
    </>
  )
}
