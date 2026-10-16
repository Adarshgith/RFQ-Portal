import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const keyword = searchParams.get('keyword')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}

    // Buyer sees own RFQs, Vendor sees only PUBLISHED, Admin sees all
    if (payload.role === 'BUYER') {
      where.buyerId = payload.id
      if (status) where.status = status
    } else if (payload.role === 'VENDOR') {
      where.status = 'PUBLISHED'
    }

    if (category) where.category = { contains: category, mode: 'insensitive' }
    if (location) where.location = { contains: location, mode: 'insensitive' }
    if (keyword) where.title = { contains: keyword, mode: 'insensitive' }

    const [rfqs, total] = await Promise.all([
      prisma.rFQ.findMany({
        where,
        include: {
          buyer: { select: { id: true, name: true, company: true } },
          lineItems: true,
          _count: { select: { quotes: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.rFQ.count({ where })
    ])

    return NextResponse.json({ rfqs, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'BUYER') {
      return NextResponse.json({ error: 'Only buyers can create RFQs' }, { status: 403 })
    }

    const { title, description, category, location, budget, deadline, lineItems } = await req.json()

    if (!title || !description || !category || !location || !deadline || !lineItems?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const rfq = await prisma.rFQ.create({
      data: {
        title, description, category, location,
        budget: budget ? parseFloat(budget) : null,
        deadline: new Date(deadline),
        buyerId: payload.id,
        lineItems: {
          create: lineItems.map((item: any) => ({
            name: item.name,
            quantity: parseInt(item.quantity),
            unit: item.unit
          }))
        }
      },
      include: { lineItems: true, buyer: { select: { id: true, name: true, company: true } } }
    })

    return NextResponse.json({ rfq }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}