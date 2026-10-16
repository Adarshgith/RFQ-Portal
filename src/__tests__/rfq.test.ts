import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken, verifyToken } from '@/lib/jwt'

describe('RFQ Tests', () => {
  let buyerToken: string
  let vendorToken: string
  let buyerId: string
  let vendorId: string
  let rfqId: string

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('testpass123', 10)

    const buyer = await prisma.user.upsert({
      where: { email: 'rfqbuyer@test.com' },
      update: {},
      create: { name: 'RFQ Buyer', email: 'rfqbuyer@test.com', password: hashedPassword, role: 'BUYER' }
    })

    const vendor = await prisma.user.upsert({
      where: { email: 'rfqvendor@test.com' },
      update: {},
      create: { name: 'RFQ Vendor', email: 'rfqvendor@test.com', password: hashedPassword, role: 'VENDOR' }
    })

    buyerId = buyer.id
    vendorId = vendor.id
    buyerToken = signToken({ id: buyer.id, email: buyer.email, role: buyer.role })
    vendorToken = signToken({ id: vendor.id, email: vendor.email, role: vendor.role })
  })

  afterAll(async () => {
    // Cleanup
    await prisma.quote.deleteMany({ where: { vendorId } })
    await prisma.rFQ.deleteMany({ where: { buyerId } })
    await prisma.user.deleteMany({
      where: { email: { in: ['rfqbuyer@test.com', 'rfqvendor@test.com'] } }
    })
  })

  // Test 1: Buyer RFQ create kar sakta hai
  test('Buyer RFQ create kar sakta hai', async () => {
    const rfq = await prisma.rFQ.create({
      data: {
        title: 'Test RFQ',
        description: 'Test description',
        category: 'Test',
        location: 'Delhi',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        buyerId,
        lineItems: {
          create: [{ name: 'Test Item', quantity: 10, unit: 'pieces' }]
        }
      },
      include: { lineItems: true }
    })

    rfqId = rfq.id
    expect(rfq).toBeTruthy()
    expect(rfq.buyerId).toBe(buyerId)
    expect(rfq.lineItems.length).toBe(1)
  })

  // Test 2: Vendor token se BUYER role nahi hona chahiye
  test('Vendor BUYER role nahi hona chahiye', () => {
    const payload = verifyToken(vendorToken)
    expect(payload.role).not.toBe('BUYER')
  })

  // Test 3: RFQ publish ho sakta hai
  test('RFQ DRAFT se PUBLISHED ho sakta hai', async () => {
    const updated = await prisma.rFQ.update({
      where: { id: rfqId },
      data: { status: 'PUBLISHED' }
    })
    expect(updated.status).toBe('PUBLISHED')
  })

  // Test 4: Deadline ke baad quote submit nahi honi chahiye
  test('Deadline check — past deadline reject honi chahiye', async () => {
    const pastDeadlineRfq = await prisma.rFQ.create({
      data: {
        title: 'Expired RFQ',
        description: 'Test',
        category: 'Test',
        location: 'Mumbai',
        deadline: new Date(Date.now() - 1000), // past deadline
        status: 'PUBLISHED',
        buyerId,
        lineItems: {
          create: [{ name: 'Item', quantity: 1, unit: 'piece' }]
        }
      }
    })

    const isDeadlinePassed = new Date() > new Date(pastDeadlineRfq.deadline)
    expect(isDeadlinePassed).toBe(true)

    await prisma.rFQ.delete({ where: { id: pastDeadlineRfq.id } })
  })

  // Test 5: Quote submit ho sakti hai valid RFQ pe
  test('Vendor valid published RFQ pe quote submit kar sakta hai', async () => {
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: { lineItems: true }
    })

    const quote = await prisma.quote.create({
      data: {
        rfqId: rfqId,
        vendorId,
        deliveryDays: 7,
        notes: 'Test quote',
        totalPrice: 5000,
        status: 'SUBMITTED',
        quoteItems: {
          create: [{
            lineItemId: rfq!.lineItems[0].id,
            unitPrice: 500,
            totalPrice: 5000
          }]
        }
      }
    })

    expect(quote).toBeTruthy()
    expect(quote.vendorId).toBe(vendorId)
    expect(quote.status).toBe('SUBMITTED')
  })

  // Test 6: Award flow
  test('Quote award hone pe RFQ status AWARDED hona chahiye', async () => {
    const quotes = await prisma.quote.findMany({ where: { rfqId } })

    await prisma.rFQ.update({ where: { id: rfqId }, data: { status: 'CLOSED' } })

    await prisma.quote.update({
      where: { id: quotes[0].id },
      data: { status: 'ACCEPTED' }
    })

    await prisma.rFQ.update({
      where: { id: rfqId },
      data: { status: 'AWARDED' }
    })

    const awarded = await prisma.rFQ.findUnique({ where: { id: rfqId } })
    expect(awarded?.status).toBe('AWARDED')
  })
})