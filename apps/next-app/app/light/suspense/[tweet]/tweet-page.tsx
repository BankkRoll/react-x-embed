import { getTweet } from 'react-x-embed/api'
import { EmbeddedTweet, TweetNotFound } from 'react-x-embed'

const TweetPage = async ({ id }: { id: string }) => {
  try {
    const tweet = await getTweet(id)
    return tweet ? <EmbeddedTweet tweet={tweet} /> : <TweetNotFound />
  } catch (error) {
    console.error(error)
    return <TweetNotFound error={error} />
  }
}

export default TweetPage
