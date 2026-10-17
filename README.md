# Bidveda RFQ Portal

A Mini Request for Quotation (RFQ) Portal built as a technical assignment for Bidveda.

## Tech Stack
- **Frontend + Backend:** Next.js 14 (App Router, TypeScript)
- **Database:** PostgreSQL + Prisma ORM v5.22.0
- **Auth:** JWT + bcrypt
- **Styling:** Tailwind CSS
- **Containerization:** Docker Compose

## Quick Start (Docker)

```bash
git clone https://github.com/Adarshgith/RFQ-Portal.git
cd RFQ-Portal
cp .env.example .env.docker
# Update .env.docker with your values
docker-compose up --build
```

App will be available at `http://localhost:3000`

## Local Setup

```bash
git clone https://github.com/Adarshgith/RFQ-Portal.git
cd RFQ-Portal
npm install
cp .env.example .env
# Update .env with your PostgreSQL credentials
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Test Credentials

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@bidveda.com        | password@123 |
| Buyer   | buyer@bidveda.com        | password@123 |
| Vendor1 | vendor1@bidveda.com      | password@123 |
| Vendor2 | vendor2@bidveda.com      | password@123 |

## Run Tests

```bash
npm test
```

## API Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | Register user |
| POST | /api/auth/login | Public | Login |
| GET | /api/rfqs | All | List RFQs |
| POST | /api/rfqs | Buyer | Create RFQ |
| GET | /api/rfqs/:id | All | Get RFQ detail |
| PATCH | /api/rfqs/:id | Buyer/Admin | Update RFQ |
| GET | /api/rfqs/:id/quotes | Buyer/Admin | Get all quotes |
| POST | /api/rfqs/:id/quotes | Vendor | Submit quote |
| POST | /api/quotes/:id/award | Buyer | Award quote |
| POST | /api/upload | All | Upload file |

## Features
- Role-based auth (Buyer, Vendor, Admin)
- RFQ create/publish/close with line items
- Quote submit/revise before deadline
- File upload (PDF/XLSX)
- Compare quotes side-by-side
- Award flow with status history
- Search & filter RFQs
- Automated tests

## Known Limitations & Next Steps
- File uploads stored locally (should use S3 in production)
- No email notifications
- No pagination on compare view
- Tests cover key flows only, more edge cases needed
- No rate limiting on API endpoints

## AI Tools Used
Claude AI (Anthropic) was used as a coding assistant for:
- Boilerplate code generation
- Debugging errors
- Docker configuration
All code has been reviewed and understood by the author.