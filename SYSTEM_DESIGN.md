# System Design Document — Bidveda Mini RFQ Portal

## 1. Requirement Understanding

### Problem Statement
A web application where:
- **Buyers** publish Requests for Quotation (RFQs)
- **Vendors** browse and submit quotes against RFQs
- **Buyers** compare quotes and award to one vendor

### Main User Flows

**Buyer Flow:**
1. Register/Login → Dashboard
2. Create RFQ with line items, deadline, budget
3. Publish RFQ → Vendors can see it
4. View incoming quotes
5. Close RFQ → Compare quotes side by side
6. Award one vendor → RFQ becomes Awarded

**Vendor Flow:**
1. Register/Login → Dashboard
2. Browse open/published RFQs (search by keyword, category, location)
3. Submit quote with price per line item, delivery days, notes
4. Revise quote before deadline
5. View quote status (Submitted/Accepted/Rejected)

**Admin Flow:**
1. Login → Dashboard
2. View all RFQs and users
3. Monitor system activity

### In Scope
- Auth with 3 roles (Buyer, Vendor, Admin)
- RFQ management with line items
- Quote submission and revision
- File upload (PDF/XLSX)
- Compare view with sorting
- Award flow with status history
- Search and filter
- Docker deployment

### Out of Scope
- Email notifications
- Payment integration
- Real-time updates (WebSockets)
- Mobile app

---

## 2. Assumptions & Open Questions

| # | Assumption | Reason |
|---|-----------|--------|
| 1 | Vendors cannot see other vendors' quotes | Privacy — competitive bidding should be blind |
| 2 | Quote revision replaces old quote (no versioning) | Simplicity — keeps data model clean for MVP |
| 3 | Only buyer who created RFQ can award it | Security — prevent unauthorized awards |
| 4 | Admin can view everything but cannot award | Admin is observer, not participant |
| 5 | File uploads stored locally in /public/uploads | MVP simplicity — S3 for production |
| 6 | One quote per vendor per RFQ | Prevents spam bidding |
| 7 | Deadline check is server-side | Client time can be manipulated |

---

## 3. Tech Stack & Reasoning

| Layer | Choice | Reason | Considered Instead |
|-------|--------|--------|--------------------|
| Frontend | Next.js 14 (App Router) | Full-stack in one repo, SSR, file-based routing | React + Express separately |
| Language | TypeScript | Type safety, better DX, fewer runtime errors | JavaScript |
| Database | PostgreSQL | Relational data, ACID compliance, strong for complex queries | MySQL, MongoDB |
| ORM | Prisma v5.22.0 | Type-safe queries, auto migrations, great DX | TypeORM, Sequelize |
| Auth | JWT + bcrypt | Stateless, scalable, no session storage needed | NextAuth, Sessions |
| Styling | Tailwind CSS | Fast UI development, no context switching | CSS Modules, MUI |
| Containerization | Docker Compose | One command setup for reviewer | Manual setup |
| Testing | Jest + ts-jest | Standard for Node.js, easy to configure | Vitest, Mocha |

---

## 4. Architecture & Services

┌─────────────────────────────────────────┐
│           Next.js 14 App                │
│                                         │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │   Frontend   │  │   API Routes     │ │
│  │   (Pages)    │  │  /api/*          │ │
│  │              │  │                  │ │
│  │  - Login     │  │  - /auth/*       │ │
│  │  - Dashboard │  │  - /rfqs/*       │ │
│  │  - RFQ pages │  │  - /quotes/*     │ │
│  │  - Compare   │  │  - /upload       │ │
│  └──────────────┘  └──────────────────┘ │
│                           │              │
│                    ┌──────▼──────┐       │
│                    │   Prisma    │       │
│                    │    ORM      │       │
│                    └──────┬──────┘       │
└───────────────────────────┼─────────────┘
                            │
                   ┌────────▼────────┐
                   │   PostgreSQL    │
                   │   Database      │
                   └─────────────────┘

File Storage: /public/uploads (local)

---

## 5. Database Model

### Tables

**User**
| Column | Type | Constraints |
|--------|------|-------------|
| id | String (cuid) | PK |
| email | String | Unique |
| password | String | Hashed (bcrypt) |
| name | String | Not null |
| role | Enum | BUYER/VENDOR/ADMIN |
| company | String | Optional |
| createdAt | DateTime | Default now() |

**RFQ**
| Column | Type | Constraints |
|--------|------|-------------|
| id | String (cuid) | PK |
| title | String | Not null |
| description | String | Not null |
| category | String | Not null |
| location | String | Not null |
| budget | Float | Optional |
| deadline | DateTime | Not null |
| status | Enum | DRAFT/PUBLISHED/CLOSED/AWARDED |
| attachments | String[] | File URLs |
| buyerId | String | FK → User |

**LineItem**
| Column | Type | Constraints |
|--------|------|-------------|
| id | String (cuid) | PK |
| name | String | Not null |
| quantity | Int | Not null |
| unit | String | Not null |
| rfqId | String | FK → RFQ (cascade delete) |

**Quote**
| Column | Type | Constraints |
|--------|------|-------------|
| id | String (cuid) | PK |
| deliveryDays | Int | Not null |
| notes | String | Optional |
| attachments | String[] | File URLs |
| totalPrice | Float | Calculated |
| status | Enum | SUBMITTED/SHORTLISTED/ACCEPTED/REJECTED |
| rfqId | String | FK → RFQ |
| vendorId | String | FK → User |

**QuoteItem**
| Column | Type | Constraints |
|--------|------|-------------|
| id | String (cuid) | PK |
| unitPrice | Float | Not null |
| totalPrice | Float | unitPrice × quantity |
| lineItemId | String | FK → LineItem (cascade delete) |
| quoteId | String | FK → Quote (cascade delete) |

**StatusHistory**
| Column | Type | Constraints |
|--------|------|-------------|
| id | String (cuid) | PK |
| entity | String | "RFQ" or "QUOTE" |
| entityId | String | RFQ or Quote ID |
| oldStatus | String | Previous status |
| newStatus | String | New status |
| changedById | String | FK → User |
| createdAt | DateTime | Default now() |

### Status Flows

RFQ: DRAFT → PUBLISHED → CLOSED → AWARDED
Quote: SUBMITTED → SHORTLISTED → ACCEPTED/REJECTED


---

## 6. API Design

### All Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | Register new user |
| POST | /api/auth/login | Public | Login, returns JWT |
| GET | /api/rfqs | All | List RFQs (role-filtered) |
| POST | /api/rfqs | Buyer | Create new RFQ |
| GET | /api/rfqs/:id | All | Get RFQ with quotes |
| PATCH | /api/rfqs/:id | Buyer/Admin | Update RFQ/status |
| GET | /api/rfqs/:id/quotes | Buyer/Admin | All quotes for RFQ |
| POST | /api/rfqs/:id/quotes | Vendor | Submit/revise quote |
| POST | /api/quotes/:id/award | Buyer | Award quote |
| POST | /api/upload | All | Upload PDF/XLSX |

### Example 1: Login
**POST /api/auth/login**
```json
Request:
{
  "email": "buyer@bidveda.com",
  "password": "password123"
}

Response 200:
{
  "token": "eyJhbGc...",
  "user": {
    "id": "clx...",
    "name": "Buyer User",
    "email": "buyer@bidveda.com",
    "role": "BUYER"
  }
}

Response 401:
{
  "error": "Invalid credentials"
}
```

### Example 2: Create RFQ
**POST /api/rfqs** `Authorization: Bearer <token>`
```json
Request:
{
  "title": "Office Supplies",
  "description": "Need furniture for office",
  "category": "Furniture",
  "location": "Hyderabad",
  "budget": 500000,
  "deadline": "2026-11-01T00:00:00Z",
  "lineItems": [
    { "name": "Chairs", "quantity": 100, "unit": "pieces" },
    { "name": "Desks", "quantity": 20, "unit": "pieces" }
  ]
}

Response 201:
{
  "rfq": {
    "id": "clx...",
    "title": "Office Supplies",
    "status": "DRAFT",
    "lineItems": [...]
  }
}
```

### Example 3: Submit Quote
**POST /api/rfqs/:id/quotes** `Authorization: Bearer <token>`
```json
Request:
{
  "deliveryDays": 7,
  "notes": "Premium quality",
  "quoteItems": [
    { "lineItemId": "clx...", "unitPrice": 2000 },
    { "lineItemId": "clx...", "unitPrice": 8000 }
  ]
}

Response 201:
{
  "quote": {
    "id": "clx...",
    "totalPrice": 360000,
    "status": "SUBMITTED"
  }
}
```

---

## 7. Key Flows

### Flow 1: Submit Quote Before Deadline
1. Vendor logs in → JWT token received
2. GET /api/rfqs → sees PUBLISHED RFQs
3. GET /api/rfqs/:id → sees line items
4. POST /api/rfqs/:id/quotes → submits quote
5. Server checks: RFQ status = PUBLISHED, deadline not passed
6. Quote created with status SUBMITTED
7. If vendor submits again → old quoteItems deleted, new ones created (revision)

### Flow 2: Reject Late Quote
1. Vendor tries POST /api/rfqs/:id/quotes after deadline
2. Server checks: `new Date() > rfq.deadline`
3. Returns 400: "Deadline passed"
4. Quote is NOT created/updated

### Flow 3: Award RFQ
1. Buyer clicks "Close RFQ" → PATCH /api/rfqs/:id `{ status: "CLOSED" }`
2. StatusHistory record created
3. Buyer goes to Compare view → sees all quotes sorted
4. Buyer clicks "Award" → POST /api/quotes/:id/award
5. In a transaction:
   - Awarded quote → status: ACCEPTED
   - All other quotes → status: REJECTED
   - RFQ → status: AWARDED
   - StatusHistory records created for all changes

---

## 8. Security & Access Control

### Role Enforcement
- Every API route extracts JWT from `Authorization: Bearer <token>` header
- `verifyToken()` decodes and validates JWT
- Role check done before any DB operation

### Vendor Data Isolation
- Vendors can only see their own quotes on RFQ detail page
- GET /api/rfqs/:id filters quotes: `rfq.quotes.filter(q => q.vendorId === payload.id)`
- GET /api/rfqs/:id/quotes returns 403 for vendors
- Vendors only see PUBLISHED RFQs, never DRAFT

### File Upload Security
- File type validated server-side (not just extension)
- Allowed: `application/pdf`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Max size: 10MB
- Filename sanitized: special characters replaced with `_`
- Files stored outside src directory

### Other Security Measures
- Passwords hashed with bcrypt (salt rounds: 10)
- JWT expires in 7 days
- Buyer can only update/award their own RFQs
- Admin cannot award (observer role only)

---

## 9. Test Cases

### Implemented ✅

| # | Test | File |
|---|------|------|
| 1 | Valid user exists in DB after seed | auth.test.ts |
| 2 | Wrong password fails bcrypt compare | auth.test.ts |
| 3 | signToken returns valid JWT string | auth.test.ts |
| 4 | Buyer token has role BUYER | auth.test.ts |
| 5 | Vendor token has role VENDOR | auth.test.ts |
| 6 | Buyer can create RFQ with line items | rfq.test.ts |
| 7 | Vendor token does not have BUYER role | rfq.test.ts |
| 8 | RFQ status changes DRAFT → PUBLISHED | rfq.test.ts |
| 9 | Past deadline is correctly detected | rfq.test.ts |
| 10 | Vendor can submit quote on valid RFQ | rfq.test.ts |
| 11 | RFQ status becomes AWARDED after award | rfq.test.ts |

### Would Add With More Time ⏳
- API-level integration tests with supertest
- Vendor cannot submit quote after deadline (API test)
- Vendor cannot see other vendor's quotes
- Only buyer can award their own RFQ
- File upload type validation test
- Concurrent quote submission test

---

## 10. Scalability & Next Steps

### What Breaks First at 100x Load
1. **File storage** — local `/public/uploads` won't scale, need S3/CloudFront
2. **Database connections** — need connection pooling (PgBouncer)
3. **No caching** — RFQ list queries hit DB every time, need Redis
4. **Single server** — no horizontal scaling, need load balancer

### What I Would Change
1. Move file uploads to AWS S3
2. Add Redis for caching RFQ listings
3. Add email notifications (deadline reminders, award notifications)
4. Add WebSocket for real-time quote updates
5. Add rate limiting (express-rate-limit)
6. Add request logging (Winston/Pino)
7. Add API versioning (/api/v1/*)
8. Separate frontend and backend deployments

### Deliberately Skipped
- Pagination on compare view (small dataset for MVP)
- Quote versioning (revision replaces, not appends)
- Audit log bonus feature
- Real-time notifications