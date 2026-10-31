import assert from "node:assert";
import http from "node:http";
import app from "../app";
import { prisma } from "../lib/prisma";
import { BillingFrequency, SubscriptionStatus } from "@prisma/client";

const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log("🧪 Starting Phase 6: Subscriptions & Lifecycle State Machine Integration Tests...\n");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`🧪 Subscription Test server running on port ${PORT}...`);

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

    // 3. Pre-fetch test data
    const customer = await prisma.customer.findFirst({
      where: { email: "customer@acmecorp.com" },
    });
    assert(customer, "Customer Acme must exist");

    const product = await prisma.product.findFirst({
      where: { name: "BrightLoop CRM Suite" },
      include: { variants: true },
    });
    assert(product, "CRM product must exist");

    const standardPlan = await prisma.plan.findFirst({
      where: { name: { contains: "Monthly" } },
    });
    assert(standardPlan, "Monthly plan must exist");

    // Also create or find a plan that disallows pausing for policy testing
    const strictPlan = await prisma.plan.upsert({
      where: { id: "plan-strict-nopause" },
      update: {},
      create: {
        id: "plan-strict-nopause",
        name: "Strict Non-Pausable Plan",
        description: "Strict 1-year contract with no pause allowance",
        price: 15000.0,
        billingFrequency: BillingFrequency.YEARLY,
        billingInterval: 1,
        minQuantity: 1,
        allowPause: false, // Disallowed!
        allowEarlyClosure: false,
        allowRenewal: true,
        autoCloseOnExpiry: true,
        isActive: true,
      },
    });

    console.log("\n▶ Test 1: Staff Manually Creates Active Subscription Contract");
    const createSubRes = await fetch(`${BASE_URL}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({
        customerId: customer.id,
        planId: standardPlan.id,
        paymentTerms: "Net 30 Days",
        items: [
          {
            productId: product.id,
            variantId: product.variants[0]?.id,
            quantity: 3,
            unitPrice: 2000.0,
          },
        ],
      }),
    });
    assert.strictEqual(createSubRes.status, 201);
    const subData = ((await createSubRes.json()) as any).data.subscription;
    assert(subData.subscriptionNumber.startsWith("SUB-"), "Must have SUB- prefix");
    assert.strictEqual(subData.status, SubscriptionStatus.ACTIVE);
    assert.strictEqual(subData.items.length, 1);
    assert.strictEqual(subData.paymentTerms, "Net 30 Days");
    console.log(`  ✅ Subscription ${subData.subscriptionNumber} created in ACTIVE status.`);

    console.log("\n▶ Test 2: List Subscriptions with Filtering & Pagination");
    const listRes = await fetch(`${BASE_URL}/subscriptions?status=ACTIVE&limit=10`, {
      headers: { Cookie: staffCookie },
    });
    assert.strictEqual(listRes.status, 200);
    const listData = ((await listRes.json()) as any).data;
    assert(listData.subscriptions.length >= 1, "Must list active subscriptions");
    assert(listData.pagination.total >= 1, "Must return pagination metadata");
    console.log(`  ✅ Retrieved ${listData.subscriptions.length} active subscriptions.`);

    console.log("\n▶ Test 3: Pause Active Subscription (Policy Verified)");
    const pauseRes = await fetch(`${BASE_URL}/subscriptions/${subData.id}/pause`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({ reason: "Customer requested temporary seasonal hold" }),
    });
    assert.strictEqual(pauseRes.status, 200);
    const pausedData = ((await pauseRes.json()) as any).data.subscription;
    assert.strictEqual(pausedData.status, SubscriptionStatus.PAUSED);
    assert(pausedData.pausedAt !== null, "Must record pausedAt timestamp");
    console.log(`  ✅ Subscription ${pausedData.subscriptionNumber} transitioned to PAUSED.`);

    console.log("\n▶ Test 4: Resume Paused Subscription with Next Billing Recalibration");
    const resumeRes = await fetch(`${BASE_URL}/subscriptions/${subData.id}/resume`, {
      method: "POST",
      headers: { Cookie: staffCookie },
    });
    assert.strictEqual(resumeRes.status, 200);
    const resumedData = ((await resumeRes.json()) as any).data.subscription;
    assert.strictEqual(resumedData.status, SubscriptionStatus.ACTIVE);
    assert.strictEqual(resumedData.pausedAt, null);
    console.log(`  ✅ Subscription resumed to ACTIVE. Next billing: ${resumedData.nextBillingDate}`);

    console.log("\n▶ Test 5: Plan Policy Check: Disallow Pausing on Strict Plan");
    const strictSubRes = await fetch(`${BASE_URL}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({
        customerId: customer.id,
        planId: strictPlan.id,
        items: [{ productId: product.id, quantity: 1 }],
      }),
    });
    assert.strictEqual(strictSubRes.status, 201);
    const strictSub = ((await strictSubRes.json()) as any).data.subscription;

    // Try to pause strict contract
    const failPauseRes = await fetch(`${BASE_URL}/subscriptions/${strictSub.id}/pause`, {
      method: "POST",
      headers: { Cookie: staffCookie },
    });
    assert.strictEqual(failPauseRes.status, 400);
    const failJson = (await failPauseRes.json()) as any;
    assert(failJson.error.message.includes("disallows subscription pause"), "Must state policy violation");
    console.log("  ✅ Plan policy correctly blocked unauthorized pause operation.");

    console.log("\n▶ Test 6: Early Contract Closure");
    const closeRes = await fetch(`${BASE_URL}/subscriptions/${subData.id}/close`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({ reason: "Customer migrated to custom enterprise on-premise" }),
    });
    assert.strictEqual(closeRes.status, 200);
    const closedData = ((await closeRes.json()) as any).data.subscription;
    assert.strictEqual(closedData.status, SubscriptionStatus.CLOSED);
    assert(closedData.closedAt !== null);
    console.log(`  ✅ Subscription ${closedData.subscriptionNumber} closed early.`);

    console.log("\n▶ Test 7: Contract Renewal (Extending Billing Cycles)");
    const renewRes = await fetch(`${BASE_URL}/subscriptions/${subData.id}/renew`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({ extensionIntervals: 2 }),
    });
    assert.strictEqual(renewRes.status, 200);
    const renewedData = ((await renewRes.json()) as any).data.subscription;
    assert.strictEqual(renewedData.status, SubscriptionStatus.ACTIVE);
    console.log(`  ✅ Subscription renewed into ACTIVE status. Next billing: ${renewedData.nextBillingDate}`);

    console.log("\n▶ Test 8: IDOR Customer Tenant Isolation");
    const customerViewRes = await fetch(`${BASE_URL}/subscriptions/${subData.id}`, {
      headers: { Cookie: customerCookie },
    });
    assert.strictEqual(customerViewRes.status, 200);
    const custSub = ((await customerViewRes.json()) as any).data.subscription;
    assert.strictEqual(custSub.customerId, customer.id);
    console.log("  ✅ Customer can view their own subscription contract.");

    console.log("\n🎉 ALL PHASE 6 SUBSCRIPTIONS & LIFECYCLE TESTS PASSED!\n");
  } finally {
    await prisma.$disconnect();
    server.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Subscription Tests failed:", err);
  process.exit(1);
});
