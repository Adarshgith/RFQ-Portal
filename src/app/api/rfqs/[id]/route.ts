import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const rfq = await prisma.rFQ.findUnique({
      where: { id: params.id },
      include: {
        buyer: { select: { id: true, name: true, company: true } },
        lineItems: true,
        quotes: {
          include: {
            vendor: { select: { id: true, name: true, company: true } },
            quoteItems: { include: { lineItem: true } }
          }
        },
        statusHistory: {
          include: { changedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })

    // Vendor can only see their own quote
    if (payload.role === 'VENDOR') {
      rfq.quotes = rfq.quotes.filter(q => q.vendorId === payload.id)
    }

    return NextResponse.json({ rfq })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const rfq = await prisma.rFQ.findUnique({ where: { id: params.id } })
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })

    // Only buyer who owns it or admin can update
    if (payload.role === 'BUYER' && rfq.buyerId !== payload.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (payload.role === 'VENDOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const oldStatus = rfq.status

    const updated = await prisma.rFQ.update({
      where: { id: params.id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description && { description: body.description }),
        ...(body.category && { category: body.category }),
        ...(body.location && { location: body.location }),
        ...(body.budget !== undefined && { budget: body.budget }),
        ...(body.deadline && { deadline: new Date(body.deadline) }),
        ...(body.status && { status: body.status }),
      },
      include: { lineItems: true }
    })

    // Track status change
    if (body.status && body.status !== oldStatus) {
      await prisma.statusHistory.create({
        data: {
          entity: 'RFQ',
          entityId: params.id,
          oldStatus,
          newStatus: body.status,
          changedById: payload.id,
          rfqId: params.id
        }
      })
    }

    return NextResponse.json({ rfq: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}