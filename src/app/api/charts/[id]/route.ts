import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const chart = await db.chart.findUnique({ where: { id } })
    if (!chart) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({
      chart: { ...chart, config: JSON.parse(chart.config) },
    })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, engine, type, config, thumbnail } = body as {
      title?: string
      engine?: string
      type?: string
      config?: unknown
      thumbnail?: string
    }
    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title
    if (engine !== undefined) data.engine = engine
    if (type !== undefined) data.type = type
    if (config !== undefined) data.config = JSON.stringify(config)
    if (thumbnail !== undefined) data.thumbnail = thumbnail
    const chart = await db.chart.update({ where: { id }, data })
    return NextResponse.json({ chart })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.chart.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    )
  }
}
