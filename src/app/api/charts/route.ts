import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const charts = await db.chart.findMany({
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ charts })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, engine, type, config, thumbnail } = body as {
      title: string
      engine: string
      type: string
      config: unknown
      thumbnail?: string
    }
    if (!title || !engine || !type || !config) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    const chart = await db.chart.create({
      data: {
        title,
        engine,
        type,
        config: JSON.stringify(config),
        thumbnail: thumbnail ?? null,
      },
    })
    return NextResponse.json({ chart })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    )
  }
}
