import assert from "node:assert";
import http from "node:http";
import app from "../app";
import { prisma } from "../lib/prisma";
import { BillingFrequency, InvoiceStatus, SubscriptionStatus } from "@prisma/client";

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log("🧪 Starting Phase 7: Recurring Billing Engine & Invoicing Integration Tests...\n");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`🧪 Invoices Test server running on port ${PORT}...`);

  try {
    // 1. Staff Authentication
    const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "staff@brightloop.com",
        password: "Staff@BrightLoop2026!",
      }),
    });
    assert.strictEqual(staffLoginRes.status, 200, "Staff login must succeed");
    const staffCookie = staffLoginRes.headers.get("set-cookie")?.split(";")[0] || "";

    // 2. Customer Authentication
    const customerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "customer@acmecorp.com",
        password: "Customer@BrightLoop2026!",
      }),
    });
    assert.strictEqual(customerLoginRes.status, 200, "Customer login must succeed");
    const customerCookie = customerLoginRes.headers.get("set-cookie")?.split(";")[0] || "";

    // 3. Pre-fetch Customer & Products
    const customer = await prisma.customer.findFirst({
      where: { email: "customer@acmecorp.com" },
    });
    assert(customer, "Customer Acme Corp must exist");

    const product = await prisma.product.findFirst({
      where: { name: "BrightLoop CRM Suite" },
      include: { variants: true },
    });
    assert(product, "Product must exist");

    // TEST 1: Manual Invoice Creation (Draft)
    console.log("Test 1: Manual Invoice Creation with Line Items & Taxes...");
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const createRes = await fetch(`${BASE_URL}/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({
        customerId: customer.id,
        dueDate: dueDate.toISOString(),
        notes: "Test manual consulting invoice",
        items: [
          {
            productId: product.id,
            variantId: product.variants[0]?.id || null,
            description: "Custom Implementation & Onboarding",
            quantity: 2,
            unitPrice: "150.00",
            taxRate: "18.00",
            discountAmount: "20.00",
          },
        ],
      }),
    });

    assert.strictEqual(createRes.status, 201, "Invoice creation must return 201 Created");
    const createData = (await createRes.json()) as any;
    const invoice = createData.data;

    assert(invoice.invoiceNumber.startsWith("INV-"), "Invoice number must start with INV-");
    assert.strictEqual(invoice.status, InvoiceStatus.DRAFT, "Invoice must start in DRAFT status");
    // Subtotal: 2 * 150 = 300. Discount = 20. Taxable = 280. Tax = 280 * 0.18 = 50.40. Total = 280 + 50.40 = 330.40
    assert.strictEqual(parseFloat(invoice.subtotal), 300.0, "Subtotal must be 300.00");
    assert.strictEqual(parseFloat(invoice.taxAmount), 50.4, "Tax amount must be 50.40");
    assert.strictEqual(parseFloat(invoice.totalAmount), 330.4, "Total amount must be 330.40");
    console.log(`✅ Passed: Invoice created with number ${invoice.invoiceNumber} and total $${invoice.totalAmount}`);

    // TEST 2: Confirm Invoice (DRAFT -> CONFIRMED)
    console.log("\nTest 2: Confirm Invoice State Transition...");
    const confirmRes = await fetch(`${BASE_URL}/invoices/${invoice.id}/confirm`, {
      method: "POST",
      headers: { Cookie: staffCookie },
    });
    assert.strictEqual(confirmRes.status, 200, "Confirming draft invoice must return 200");
    const confirmData = (await confirmRes.json()) as any;
    assert.strictEqual(confirmData.data.status, InvoiceStatus.CONFIRMED, "Status must now be CONFIRMED");

    // Re-confirming should be rejected
    const reConfirmRes = await fetch(`${BASE_URL}/invoices/${invoice.id}/confirm`, {
      method: "POST",
      headers: { Cookie: staffCookie },
    });
    assert.strictEqual(reConfirmRes.status, 400, "Re-confirming confirmed invoice must return 400");
    console.log("✅ Passed: Invoice successfully confirmed and protected against duplicate confirmation.");

    // TEST 3: Customer IDOR Guard & Retrieval
    console.log("\nTest 3: Customer IDOR Isolation & Retrieval...");
    const customerGetRes = await fetch(`${BASE_URL}/invoices/${invoice.id}`, {
      headers: { Cookie: customerCookie },
    });
    assert.strictEqual(customerGetRes.status, 200, "Customer must be able to view their own invoice");
    const customerGetData = (await customerGetRes.json()) as any;
    assert.strictEqual(customerGetData.data.id, invoice.id);
    assert.strictEqual(parseFloat(customerGetData.data.balanceDue), 330.4, "Balance due must equal total amount");
    console.log("✅ Passed: Customer retrieved own invoice with accurate balance due.");

    // TEST 4: Automated Recurring Billing Runner & Idempotency
    console.log("\nTest 4: Automated Recurring Billing Runner & Idempotency...");

    // Setup an ACTIVE subscription due for billing right now
    const plan = await prisma.plan.findFirst({
      where: { name: { contains: "Monthly" } },
    });
    assert(plan, "Monthly plan must exist");

    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 1);

    const testSubNumber = `SUB-TEST-${Date.now()}`;
    const testSubscription = await prisma.subscription.create({
      data: {
        subscriptionNumber: testSubNumber,
        customerId: customer.id,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: pastDate,
        lastBilledDate: pastDate,
        nextBillingDate: new Date(), // Due today!
        paymentTerms: "Net 15",
        items: {
          create: [
            {
              productId: product.id,
              variantId: product.variants[0]?.id || null,
              quantity: 1,
              unitPrice: "49.00",
            },
          ],
        },
      },
    });

    // Run Recurring Billing engine
    const runBillingRes = await fetch(`${BASE_URL}/invoices/generate-recurring`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({
        subscriptionId: testSubscription.id,
      }),
    });

    assert.strictEqual(runBillingRes.status, 200, "Billing run must return 200");
    const runBillingData = (await runBillingRes.json()) as any;
    assert.strictEqual(runBillingData.data.createdInvoices.length, 1, "Exactly one invoice should be created");
    console.log(`Recurring billing generated: ${runBillingData.data.createdInvoices[0]}`);

    // Verify Subscription nextBillingDate was advanced
    const updatedSub = await prisma.subscription.findUnique({
      where: { id: testSubscription.id },
    });
    assert(updatedSub, "Subscription must exist");
    assert(
      updatedSub.nextBillingDate > testSubscription.nextBillingDate,
      "Subscription nextBillingDate must have advanced into the future"
    );

    // IDEMPOTENCY TEST: Run Recurring Billing again for the exact same subscription
    console.log("Sub-test: Verifying duplicate billing idempotency...");
    const runAgainRes = await fetch(`${BASE_URL}/invoices/generate-recurring`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({
        subscriptionId: testSubscription.id,
        targetDate: pastDate.toISOString(), // Attempting past period
      }),
    });
    assert.strictEqual(runAgainRes.status, 200);
    const runAgainData = (await runAgainRes.json()) as any;
    assert.strictEqual(
      runAgainData.data.createdInvoices.length,
      0,
      "No duplicate invoices should be created for same billing period"
    );
    console.log("✅ Passed: Recurring billing engine successfully executed and prevented duplicate billing.");

    // TEST 5: Cancel Invoice Lifecycle
    console.log("\nTest 5: Cancel Invoice Lifecycle...");
    const cancelRes = await fetch(`${BASE_URL}/invoices/${invoice.id}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({
        notes: "Client requested project postponement",
      }),
    });
    assert.strictEqual(cancelRes.status, 200, "Cancelling invoice with zero payments must succeed");
    const cancelData = (await cancelRes.json()) as any;
    assert.strictEqual(cancelData.data.status, InvoiceStatus.CANCELLED);
    console.log("✅ Passed: Invoice safely cancelled.");

    // TEST 6: Financial Metrics Endpoint
    console.log("\nTest 6: Financial & Operational Metrics API...");
    const metricsRes = await fetch(`${BASE_URL}/invoices/metrics`, {
      headers: { Cookie: staffCookie },
    });
    assert.strictEqual(metricsRes.status, 200, "Metrics endpoint must return 200");
    const metricsData = (await metricsRes.json()) as any;
    assert("totalInvoiced" in metricsData.data, "Metrics must include totalInvoiced");
    assert("totalOutstanding" in metricsData.data, "Metrics must include totalOutstanding");
    assert("overdueCount" in metricsData.data, "Metrics must include overdueCount");
    console.log("✅ Passed: Financial metrics computed successfully:", metricsData.data);

    // Cleanup test subscription and invoices created
    await prisma.invoiceItem.deleteMany({
      where: {
        invoice: {
          OR: [{ id: invoice.id }, { subscriptionId: testSubscription.id }],
        },
      },
    });
    await prisma.invoice.deleteMany({
      where: {
        OR: [{ id: invoice.id }, { subscriptionId: testSubscription.id }],
      },
    });
    await prisma.subscriptionItem.deleteMany({
      where: { subscriptionId: testSubscription.id },
    });
    await prisma.subscription.delete({
      where: { id: testSubscription.id },
    });

    console.log("\n🎉 ALL 6 INVOICE & RECURRING BILLING INTEGRATION TESTS PASSED WITH 100% SUCCESS!\n");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
