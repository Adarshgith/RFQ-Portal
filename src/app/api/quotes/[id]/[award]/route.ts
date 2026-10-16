import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'BUYER') {
      return NextResponse.json({ error: 'Only buyers can award quotes' }, { status: 403 })
    }

    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: { rfq: true }
    })

    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    if (quote.rfq.buyerId !== payload.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (quote.rfq.status === 'AWARDED') return NextResponse.json({ error: 'RFQ already awarded' }, { status: 400 })

    // Award this quote, reject all others
    await prisma.$transaction(async (tx) => {
      await tx.quote.update({
        where: { id: params.id },
        data: { status: 'ACCEPTED' }
      })

      await tx.quote.updateMany({
        where: { rfqId: quote.rfqId, id: { not: params.id } },
        data: { status: 'REJECTED' }
      })

      await tx.rFQ.update({
        where: { id: quote.rfqId },
        data: { status: 'AWARDED' }
      })

      await tx.statusHistory.create({
        data: {
          entity: 'RFQ',
          entityId: quote.rfqId,
          oldStatus: quote.rfq.status,
          newStatus: 'AWARDED',
          changedById: payload.id,
          rfqId: quote.rfqId
        }
      })

      await tx.statusHistory.create({
        data: {
          entity: 'QUOTE',
          entityId: params.id,
          oldStatus: quote.status,
          newStatus: 'ACCEPTED',
          changedById: payload.id,
          quoteId: params.id
        }
      })
    })

    return NextResponse.json({ message: 'Quote awarded successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}