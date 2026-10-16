import { PrismaClient, Role, RFQStatus, QuoteStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const hashedPassword = await bcrypt.hash('password@123', 10)

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bidveda.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@bidveda.com', password: hashedPassword, role: Role.ADMIN, company: 'Bidveda' }
  })

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@bidveda.com' },
    update: {},
    create: { name: 'Buyer User', email: 'buyer@bidveda.com', password: hashedPassword, role: Role.BUYER, company: 'Acme Constructions' }
  })

  const vendor1 = await prisma.user.upsert({
    where: { email: 'vendor1@bidveda.com' },
    update: {},
    create: { name: 'Vendor One', email: 'vendor1@bidveda.com', password: hashedPassword, role: Role.VENDOR, company: 'VendorA Supplies' }
  })

  const vendor2 = await prisma.user.upsert({
    where: { email: 'vendor2@bidveda.com' },
    update: {},
    create: { name: 'Vendor Two', email: 'vendor2@bidveda.com', password: hashedPassword, role: Role.VENDOR, company: 'VendorB Trading' }
  })

  // RFQ 1 - Published
  const rfq1 = await prisma.rFQ.create({
    data: {
      title: 'Office Supplies for Hyderabad Site',
      description: 'Need office furniture for new Hyderabad office',
      category: 'Furniture',
      location: 'Hyderabad',
      budget: 500000,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: RFQStatus.PUBLISHED,
      buyerId: buyer.id,
      lineItems: {
        create: [
          { name: 'Office Chairs', quantity: 100, unit: 'pieces' },
          { name: 'Office Desks', quantity: 20, unit: 'pieces' }
        ]
      }
    },
    include: { lineItems: true }
  })

  // RFQ 2 - Draft
  await prisma.rFQ.create({
    data: {
      title: 'IT Equipment Procurement',
      description: 'Laptops and accessories for engineering team',
      category: 'Electronics',
      location: 'Bangalore',
      budget: 1000000,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: RFQStatus.DRAFT,
      buyerId: buyer.id,
      lineItems: {
        create: [
          { name: 'Laptops', quantity: 10, unit: 'pieces' },
          { name: 'Monitors', quantity: 10, unit: 'pieces' }
        ]
      }
    }
  })

  // Quotes for RFQ 1
  const chairs = rfq1.lineItems.find(i => i.name === 'Office Chairs')!
  const desks = rfq1.lineItems.find(i => i.name === 'Office Desks')!

  await prisma.quote.create({
    data: {
      rfqId: rfq1.id,
      vendorId: vendor1.id,
      deliveryDays: 10,
      notes: 'Premium quality furniture',
      totalPrice: 360000,
      status: QuoteStatus.SUBMITTED,
      quoteItems: {
        create: [
          { lineItemId: chairs.id, unitPrice: 2000, totalPrice: 200000 },
          { lineItemId: desks.id, unitPrice: 8000, totalPrice: 160000 }
        ]
      }
    }
  })

  await prisma.quote.create({
    data: {
      rfqId: rfq1.id,
      vendorId: vendor2.id,
      deliveryDays: 7,
      notes: 'Fast delivery guaranteed',
      totalPrice: 360000,
      status: QuoteStatus.SUBMITTED,
      quoteItems: {
        create: [
          { lineItemId: chairs.id, unitPrice: 2200, totalPrice: 220000 },
          { lineItemId: desks.id, unitPrice: 7000, totalPrice: 140000 }
        ]
      }
    }
  })

  console.log('✅ Seeding complete!')
  console.log('👤 Admin:   admin@bidveda.com / password@123')
  console.log('👤 Buyer:   buyer@bidveda.com / password@123')
  console.log('👤 Vendor1: vendor1@bidveda.com / password@123')
  console.log('👤 Vendor2: vendor2@bidveda.com / password@123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })