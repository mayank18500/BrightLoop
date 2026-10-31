import assert from "assert";
import http from "http";
import app from "../app";
import { prisma } from "../lib/prisma";

const PORT = 5097;

async function runTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`🧪 Quotation Test server running on port ${PORT}...`);

  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  try {
    // 1. Authenticate Staff
    const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "staff@brightloop.com",
        password: "Staff@BrightLoop2026!",
      }),
    });
    assert.strictEqual(staffLoginRes.status, 200);
    const staffCookie = staffLoginRes.headers.get("set-cookie")?.split(";")[0] || "";

    // 2. Authenticate Customer
    const customerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "customer@acmecorp.com",
        password: "Customer@BrightLoop2026!",
      }),
    });
    assert.strictEqual(customerLoginRes.status, 200);
    const customerCookie = customerLoginRes.headers.get("set-cookie")?.split(";")[0] || "";

    // Fetch existing customer record, product, and plan for testing
    const customer = await prisma.customer.findFirst({
      where: { email: "customer@acmecorp.com" },
    });
    assert(customer, "Customer Acme Enterprises must exist");

    const product = await prisma.product.findFirst({
      where: { name: "BrightLoop CRM Suite" },
      include: { variants: true },
    });
    assert(product, "CRM product must exist");
    const enterpriseVariant = product.variants.find((v) => v.name.includes("Enterprise"));
    assert(enterpriseVariant, "Enterprise variant must exist");

    const plan = await prisma.plan.findFirst({
      where: { name: { contains: "Annual" } },
    });
    assert(plan, "Annual plan must exist");

    console.log("\n▶ Test 1: Staff Creates Reusable Quotation Template");
    const templateRes = await fetch(`${BASE_URL}/quotations/templates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({
        name: "Enterprise Multi-Seat Preset",
        description: "Standard package for corporate rollouts",
        validityDays: 45,
        templateData: [
          {
            productId: product.id,
            variantId: enterpriseVariant.id,
            quantity: 5,
          },
        ],
      }),
    });
    if (templateRes.status !== 201) {
      console.error("Template creation failed:", JSON.stringify(await templateRes.json(), null, 2));
    }
    assert.strictEqual(templateRes.status, 201);
    const templateData = ((await templateRes.json()) as any).data.template;
    assert.strictEqual(templateData.name, "Enterprise Multi-Seat Preset");
    console.log("  ✅ Reusable quotation template created.");

    console.log("\n▶ Test 2: Staff Generates Customer Quotation with Snapshot Pricing");
    const createQuoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({
        customerId: customer.id,
        planId: plan.id,
        validityDays: 30,
        discountCode: "WELCOME10", // 10% coupon
        items: [
          {
            productId: product.id,
            variantId: enterpriseVariant.id,
            quantity: 2,
          },
        ],
      }),
    });
    assert.strictEqual(createQuoteRes.status, 201);
    const quoteData = ((await createQuoteRes.json()) as any).data.quotation;
    assert(quoteData.quotationNumber.startsWith("QT-"), "Must have QT- prefix");
    assert.strictEqual(quoteData.status, "DRAFT");
    assert.strictEqual(quoteData.items.length, 1);

    // Verify snapshot calculations:
    // Base 2000 + Variant 1000 = unit price 3000 * 2 = 6000 subtotal
    // Tax 18% of 6000 = 1080
    // Discount 10% of 6000 = 600
    // Total = 6000 + 1080 - 600 = 6480
    assert.strictEqual(parseFloat(quoteData.subtotal), 6000.0);
    assert.strictEqual(parseFloat(quoteData.taxAmount), 1080.0);
    assert.strictEqual(parseFloat(quoteData.discountAmount), 600.0);
    assert.strictEqual(parseFloat(quoteData.totalAmount), 6480.0);
    console.log(`  ✅ Quotation ${quoteData.quotationNumber} generated with snapshot total: ₹${quoteData.totalAmount}`);

    console.log("\n▶ Test 3: Validate Lifecycle Transitions: DRAFT -> SENT -> CONFIRMED");
    // Send
    const sendRes = await fetch(`${BASE_URL}/quotations/${quoteData.id}/send`, {
      method: "POST",
      headers: { Cookie: staffCookie },
    });
    assert.strictEqual(sendRes.status, 200);
    const sentData = ((await sendRes.json()) as any).data.quotation;
    assert.strictEqual(sentData.status, "SENT");
    console.log("  ✅ Quotation transitioned to SENT.");

    // Prevent conversion prior to confirmation
    const prematureConvertRes = await fetch(`${BASE_URL}/quotations/${quoteData.id}/convert`, {
      method: "POST",
      headers: { Cookie: staffCookie },
    });
    assert.strictEqual(prematureConvertRes.status, 400, "Cannot convert non-confirmed quotation");
    console.log("  ✅ Conversion of non-confirmed quotation rejected (400 Bad Request).");

    // Confirm
    const confirmRes = await fetch(`${BASE_URL}/quotations/${quoteData.id}/confirm`, {
      method: "POST",
      headers: { Cookie: staffCookie },
    });
    assert.strictEqual(confirmRes.status, 200);
    const confirmedData = ((await confirmRes.json()) as any).data.quotation;
    assert.strictEqual(confirmedData.status, "CONFIRMED");
    console.log("  ✅ Quotation transitioned to CONFIRMED.");

    console.log("\n▶ Test 4: Convert CONFIRMED Quotation to Active Subscription");
    const convertRes = await fetch(`${BASE_URL}/quotations/${quoteData.id}/convert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({
        paymentTerms: "Net 30",
      }),
    });
    assert.strictEqual(convertRes.status, 201);
    const convertResult = ((await convertRes.json()) as any).data;
    const subscription = convertResult.subscription;
    assert(subscription.subscriptionNumber.startsWith("SUB-"), "Must have SUB- prefix");
    assert.strictEqual(subscription.status, "ACTIVE");
    assert.strictEqual(subscription.paymentTerms, "Net 30");
    assert.strictEqual(subscription.items.length, 1);
    // Agreed price snapshot transferred
    assert.strictEqual(parseFloat(subscription.items[0].unitPrice), 3000.0);
    console.log(`  ✅ Successfully converted to Subscription: ${subscription.subscriptionNumber}`);
    console.log(`  ✅ Next billing date: ${subscription.nextBillingDate}`);

    console.log("\n▶ Test 5: Prevent Duplicate Conversion");
    const dupConvertRes = await fetch(`${BASE_URL}/quotations/${quoteData.id}/convert`, {
      method: "POST",
      headers: { Cookie: staffCookie },
    });
    assert.strictEqual(dupConvertRes.status, 409, "Must return 409 Conflict for duplicate conversion");
    console.log("  ✅ Duplicate conversion prevented (409 Conflict).");

    console.log("\n▶ Test 6: Customer Portal Isolation");
    // Customer can view their own quotation
    const customerQuoteRes = await fetch(`${BASE_URL}/quotations/${quoteData.id}`, {
      headers: { Cookie: customerCookie },
    });
    assert.strictEqual(customerQuoteRes.status, 200);
    console.log("  ✅ Customer can view their own quotation.");

    // Customer is blocked from converting (Staff/Admin only)
    const customerForbiddenConvert = await fetch(`${BASE_URL}/quotations/${quoteData.id}/convert`, {
      method: "POST",
      headers: { Cookie: customerCookie },
    });
    assert.strictEqual(customerForbiddenConvert.status, 403, "Customer cannot execute conversion endpoint");
    console.log("  ✅ RBAC blocked Customer from converting quotation (403 Forbidden).");

    console.log("\n🎉 ALL PHASE 5 QUOTATIONS & CONVERSION PIPELINE TESTS PASSED!\n");
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
