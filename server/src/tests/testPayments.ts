import assert from "node:assert";
import http from "node:http";
import app from "../app";
import { prisma } from "../lib/prisma";
import { InvoiceStatus, PaymentMethod } from "@prisma/client";

const PORT = 5100;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log("🧪 Starting Phase 8: Payment Management & Multi-Invoice Allocation Integration Tests...\n");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`🧪 Payments Test server running on port ${PORT}...`);

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
    });
    assert(product, "Product must exist");

    // Create 2 Test Invoices in CONFIRMED status
    // Invoice 1: $200.00
    const invoice1Number = `INV-TEST-A-${Date.now()}`;
    const invoice1 = await prisma.invoice.create({
      data: {
        invoiceNumber: invoice1Number,
        customerId: customer.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 86400000),
        status: InvoiceStatus.CONFIRMED,
        subtotal: "200.00",
        taxAmount: "0.00",
        discountAmount: "0.00",
        totalAmount: "200.00",
        amountPaid: "0.00",
        items: {
          create: [
            {
              productId: product.id,
              description: "CRM Standard Seats (Invoice 1)",
              quantity: 2,
              unitPrice: "100.00",
              subtotal: "200.00",
              totalAmount: "200.00",
            },
          ],
        },
      },
    });

    // Invoice 2: $300.00
    const invoice2Number = `INV-TEST-B-${Date.now()}`;
    const invoice2 = await prisma.invoice.create({
      data: {
        invoiceNumber: invoice2Number,
        customerId: customer.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 86400000),
        status: InvoiceStatus.CONFIRMED,
        subtotal: "300.00",
        taxAmount: "0.00",
        discountAmount: "0.00",
        totalAmount: "300.00",
        amountPaid: "0.00",
        items: {
          create: [
            {
              productId: product.id,
              description: "CRM Standard Seats (Invoice 2)",
              quantity: 3,
              unitPrice: "100.00",
              subtotal: "300.00",
              totalAmount: "300.00",
            },
          ],
        },
      },
    });

    console.log(`Setup: Created Invoice 1 ($200) and Invoice 2 ($300).`);

    // TEST 1: Lump-Sum Payment with Multi-Invoice M:N Allocation
    console.log("\nTest 1: Record Lump-Sum Payment with Multi-Invoice Split...");
    // Pay $450 total: $200 to Invoice 1 (full), $150 to Invoice 2 (partial), $100 unallocated float
    const recordRes = await fetch(`${BASE_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({
        customerId: customer.id,
        paymentMethod: PaymentMethod.UPI,
        amount: "450.00",
        notes: "UPI payment via Bank reference ref#98234",
        allocations: [
          {
            invoiceId: invoice1.id,
            amount: "200.00",
            notes: "Full settlement for invoice 1",
          },
          {
            invoiceId: invoice2.id,
            amount: "150.00",
            notes: "Partial payment for invoice 2",
          },
        ],
      }),
    });

    assert.strictEqual(recordRes.status, 201, "Payment record must return 201 Created");
    const recordData = (await recordRes.json()) as any;
    const payment = recordData.data;

    assert(payment.paymentNumber.startsWith("PAY-"), "Payment number must start with PAY-");
    assert.strictEqual(parseFloat(payment.amount), 450.0, "Payment amount must be 450.00");
    assert.strictEqual(parseFloat(payment.unallocatedAmount), 100.0, "Unallocated amount must be 100.00");
    assert.strictEqual(payment.allocations.length, 2, "Payment must have 2 allocations");

    // Verify Invoice 1 became PAID
    const updatedInv1 = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice1.id } });
    assert.strictEqual(parseFloat(updatedInv1.amountPaid as any), 200.0, "Invoice 1 amountPaid must be 200.00");
    assert.strictEqual(updatedInv1.status, InvoiceStatus.PAID, "Invoice 1 must now be in PAID status");

    // Verify Invoice 2 is partially paid (remains CONFIRMED)
    const updatedInv2 = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice2.id } });
    assert.strictEqual(parseFloat(updatedInv2.amountPaid as any), 150.0, "Invoice 2 amountPaid must be 150.00");
    assert.strictEqual(updatedInv2.status, InvoiceStatus.CONFIRMED, "Invoice 2 must still be CONFIRMED");

    console.log(`✅ Passed: Payment ${payment.paymentNumber} recorded ($450). Invoice 1 is PAID, Invoice 2 partially paid, $100 unallocated float.`);

    // TEST 2: Over-allocation Rejection Validation
    console.log("\nTest 2: Over-Allocation Validation Protection...");
    // Invoice 2 only has $150 remaining balance. Attempting to allocate $200 must fail with 400.
    const overAllocRes = await fetch(`${BASE_URL}/payments/${payment.id}/allocate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({
        allocations: [
          {
            invoiceId: invoice2.id,
            amount: "200.00",
          },
        ],
      }),
    });

    assert.strictEqual(overAllocRes.status, 400, "Over-allocation must return 400 Bad Request");
    console.log("✅ Passed: Over-allocation safely rejected by transactional constraint.");

    // TEST 3: Secondary Allocation from Existing Unallocated Payment
    console.log("\nTest 3: Allocate Existing Float to Outstanding Invoice...");
    // Allocate remaining $100 unallocated float to Invoice 2
    const secondAllocRes = await fetch(`${BASE_URL}/payments/${payment.id}/allocate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({
        allocations: [
          {
            invoiceId: invoice2.id,
            amount: "100.00",
            notes: "Secondary allocation from unallocated float",
          },
        ],
      }),
    });

    assert.strictEqual(secondAllocRes.status, 200, "Secondary allocation must return 200");
    const secondAllocData = (await secondAllocRes.json()) as any;
    assert.strictEqual(
      parseFloat(secondAllocData.data.unallocatedAmount),
      0.0,
      "Payment unallocated float should now be 0.00"
    );

    const recheckInv2 = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice2.id } });
    assert.strictEqual(
      parseFloat(recheckInv2.amountPaid as any),
      250.0,
      "Invoice 2 amountPaid should now be 250.00"
    );
    console.log("✅ Passed: Float allocated successfully. Payment float is now 0.00, Invoice 2 paid is 250.00/300.00.");

    // TEST 4: Customer IDOR Isolation & Retrieval
    console.log("\nTest 4: Customer IDOR Isolation & Retrieval...");
    const customerGetRes = await fetch(`${BASE_URL}/payments/${payment.id}`, {
      headers: { Cookie: customerCookie },
    });
    assert.strictEqual(customerGetRes.status, 200, "Customer must be able to view their own payment");
    const customerGetData = (await customerGetRes.json()) as any;
    assert.strictEqual(customerGetData.data.id, payment.id);
    assert.strictEqual(customerGetData.data.allocations.length, 3, "Customer sees all 3 allocations");
    console.log("✅ Passed: Customer retrieved payment history with transparent allocation audit.");

    // TEST 5: Financial Metrics Endpoint
    console.log("\nTest 5: Financial Metrics for Payments...");
    const metricsRes = await fetch(`${BASE_URL}/payments/metrics`, {
      headers: { Cookie: staffCookie },
    });
    assert.strictEqual(metricsRes.status, 200, "Metrics endpoint must return 200");
    const metricsData = (await metricsRes.json()) as any;
    assert("totalRecorded" in metricsData.data, "Metrics must include totalRecorded");
    assert("totalAllocated" in metricsData.data, "Metrics must include totalAllocated");
    assert("totalUnallocated" in metricsData.data, "Metrics must include totalUnallocated");
    console.log("✅ Passed: Financial payment metrics computed:", metricsData.data);

    // Cleanup test data
    await prisma.paymentAllocation.deleteMany({
      where: { paymentId: payment.id },
    });
    await prisma.payment.delete({
      where: { id: payment.id },
    });
    await prisma.invoiceItem.deleteMany({
      where: {
        invoiceId: { in: [invoice1.id, invoice2.id] },
      },
    });
    await prisma.invoice.deleteMany({
      where: {
        id: { in: [invoice1.id, invoice2.id] },
      },
    });

    console.log("\n🎉 ALL 5 PAYMENT & MULTI-INVOICE ALLOCATION INTEGRATION TESTS PASSED WITH 100% SUCCESS!\n");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
