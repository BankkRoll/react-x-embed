type MediaImgProps = {
  src: string
  alt: string
  className?: string
  draggable?: boolean
  /** Wider renditions of the same image, for retina displays. */
  srcSet?: string
  /** How wide the image renders, so the browser can pick from `srcSet`. */
  sizes?: string
}

// eslint-disable-next-line jsx-a11y/alt-text -- The alt text is part of `...props`
export const MediaImg = (props: MediaImgProps) => <img {...props} />
