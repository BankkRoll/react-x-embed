import { normalizeAvatarUrl } from '../utils.js'

type AvatarImgProps = {
  src: string
  alt: string
  width: number
  height: number
}

export const AvatarImg = (props: AvatarImgProps) => (
  // eslint-disable-next-line jsx-a11y/alt-text -- The alt text is part of `...props`
  <img {...props} src={normalizeAvatarUrl(props.src)} />
)
