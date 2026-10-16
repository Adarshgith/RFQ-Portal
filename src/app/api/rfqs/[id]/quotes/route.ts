import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    if (payload.role === "VENDOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const quotes = await prisma.quote.findMany({
      where: { rfqId: params.id },
      include: {
        vendor: { select: { id: true, name: true, company: true } },
        quoteItems: { include: { lineItem: true } },
      },
      orderBy: { totalPrice: "asc" },
    });

    return NextResponse.json({ quotes });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json(
        { error: "Only vendors can submit quotes" },
        { status: 403 },
      );
    }

    const rfq = await prisma.rFQ.findUnique({
      where: { id: params.id },
      include: { lineItems: true },
    });

    if (!rfq)
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    if (rfq.status !== "PUBLISHED")
      return NextResponse.json({ error: "RFQ is not open" }, { status: 400 });
    if (new Date() > rfq.deadline)
      return NextResponse.json({ error: "Deadline passed" }, { status: 400 });

    const { deliveryDays, notes, quoteItems, attachments } = await req.json();

    // Check if vendor already submitted — if yes, update (revision)
    const existing = await prisma.quote.findFirst({
      where: { rfqId: params.id, vendorId: payload.id },
    });

    const totalPrice = quoteItems.reduce((sum: number, item: any) => {
      const lineItem = rfq.lineItems.find((l) => l.id === item.lineItemId);
      return sum + parseFloat(item.unitPrice) * (lineItem?.quantity || 1);
    }, 0);

    if (existing) {
      // Revision — delete old quoteItems and recreate
      await prisma.quoteItem.deleteMany({ where: { quoteId: existing.id } });

      const updated = await prisma.quote.update({
        where: { id: existing.id },
        data: {
          deliveryDays,
          notes,
          totalPrice,
          attachments: attachments || [],
          quoteItems: {
            create: quoteItems.map((item: any) => ({
              lineItemId: item.lineItemId,
              unitPrice: parseFloat(item.unitPrice),
              totalPrice:
                parseFloat(item.unitPrice) *
                (rfq.lineItems.find((l: any) => l.id === item.lineItemId)
                  ?.quantity || 1),
            })),
          },
        },
        include: { quoteItems: { include: { lineItem: true } } },
      });
      return NextResponse.json({ quote: updated, revised: true });
    }

    // New quote
    const quote = await prisma.quote.create({
      data: {
        rfqId: params.id,
        vendorId: payload.id,
        deliveryDays,
        notes,
        totalPrice,
        attachments: attachments || [],
        quoteItems: {
          create: quoteItems.map((item: any) => ({
            lineItemId: item.lineItemId,
            unitPrice: parseFloat(item.unitPrice),
            totalPrice:
              parseFloat(item.unitPrice) *
              (rfq.lineItems.find((l: any) => l.id === item.lineItemId)
                ?.quantity || 1),
          })),
        },
      },
      include: { quoteItems: { include: { lineItem: true } } },
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
