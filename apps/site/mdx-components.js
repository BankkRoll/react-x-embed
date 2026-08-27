import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs'
import { TweetPlayground } from './src/components/tweet-playground'

const docsComponents = getDocsMDXComponents()

export const useMDXComponents = (components) => ({
  ...docsComponents,
  TweetPlayground,
  ...components,
})
