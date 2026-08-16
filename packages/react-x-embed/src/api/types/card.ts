import type { RGB } from './media.js'

/**
 * A single value in a card's `binding_values` map.
 *
 * X models card content as a loosely typed bag of bindings rather than a fixed
 * schema, and which keys are present depends on `card.name`.
 */
export type CardBindingValue =
  | { type: 'STRING'; string_value: string }
  | { type: 'IMAGE'; image_value: CardImageValue }
  | { type: 'IMAGE_COLOR'; image_color_value: CardImageColorValue }
  | { type: 'BOOLEAN'; boolean_value: boolean }
  | { type: 'USER'; user_value: { id_str: string } }

export interface CardImageValue {
  url: string
  width: number
  height: number
  alt?: string
}

export interface CardImageColorValue {
  palette: {
    rgb: RGB
    percentage: number
  }[]
}

/**
 * A card attached to a tweet — the preview shown for a shared link.
 *
 * `name` identifies the layout X would use. The common ones are
 * `summary_large_image` (wide hero image above the text) and `summary`
 * (small square thumbnail beside it); `player` and `unified_card` describe
 * richer embeds that fall back to a plain link here.
 */
export interface TweetCard {
  name: string
  url: string
  card_platform?: {
    platform: {
      audience: { name: string }
      device: { name: string; version: string }
    }
  }
  binding_values: Record<string, CardBindingValue>
}
