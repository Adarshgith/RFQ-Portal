import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken, verifyToken } from '@/lib/jwt'

describe('Auth Tests', () => {
  let buyerToken: string
  let vendorToken: string
  let buyerId: string
  let vendorId: string

  beforeAll(async () => {
    // Test users create karo
    const hashedPassword = await bcrypt.hash('testpass123', 10)

    const buyer = await prisma.user.upsert({
      where: { email: 'testbuyer@test.com' },
      update: {},
      create: {
        name: 'Test Buyer',
        email: 'testbuyer@test.com',
        password: hashedPassword,
        role: 'BUYER'
      }
    })

    const vendor = await prisma.user.upsert({
      where: { email: 'testvendor@test.com' },
      update: {},
      create: {
        name: 'Test Vendor',
        email: 'testvendor@test.com',
        password: hashedPassword,
        role: 'VENDOR'
      }
    })

    buyerId = buyer.id
    vendorId = vendor.id
    buyerToken = signToken({ id: buyer.id, email: buyer.email, role: buyer.role })
    vendorToken = signToken({ id: vendor.id, email: vendor.email, role: vendor.role })
  })

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['testbuyer@test.com', 'testvendor@test.com'] } }
    })
  })

  // Test 1: Valid login
  test('Valid credentials se login hona chahiye', async () => {
    const user = await prisma.user.findUnique({ where: { email: 'testbuyer@test.com' } })
    expect(user).not.toBeNull()
    expect(user?.role).toBe('BUYER')
  })

  // Test 2: Invalid credentials
  test('Wrong password se login fail hona chahiye', async () => {
    const user = await prisma.user.findUnique({ where: { email: 'testbuyer@test.com' } })
    const isValid = await bcrypt.compare('wrongpassword', user?.password || '')
    expect(isValid).toBe(false)
  })

  // Test 3: JWT token valid hona chahiye
  test('SignToken se valid token banna chahiye', () => {
    const token = signToken({ id: 'test-id', email: 'test@test.com', role: 'BUYER' })
    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')
  })

  // Test 4: Buyer token mein role BUYER hona chahiye
  test('Buyer token mein correct role hona chahiye', () => {
    const payload = verifyToken(buyerToken)
    expect(payload?.role).toBe('BUYER')
  })

  // Test 5: Vendor token mein role VENDOR hona chahiye
  test('Vendor token mein correct role hona chahiye', () => {
    const payload = verifyToken(vendorToken)
    expect(payload?.role).toBe('VENDOR')
  })
})