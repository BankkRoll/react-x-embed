import { NextResponse } from 'next/server'
import { getTweet } from 'react-x-embed/api'

export const fetchCache = 'only-cache'

export async function GET(
  _req: Request,
  { params }: RouteContext<'/api/tweet/[id]'>
) {
  try {
    const { id } = await params
    const tweet = await getTweet(id)
    return NextResponse.json(
      { data: tweet ?? null },
      { status: tweet ? 200 : 404 }
    )
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      { error: error.message ?? 'Bad request.' },
      { status: 400 }
    )
  }
}
