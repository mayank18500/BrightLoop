import assert from "assert";
import http from "http";
import app from "../app";
import { prisma } from "../lib/prisma";

const PORT = 5098;

async function runTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`🧪 Catalog Test server running on port ${PORT}...`);

  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  try {
    // 1. Authenticate as Admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@brightloop.com",
        password: "Admin@BrightLoop2026!",
      }),
    });
    assert.strictEqual(adminLoginRes.status, 200);
    const adminCookie = adminLoginRes.headers.get("set-cookie")?.split(";")[0] || "";

    // 2. Authenticate as Customer
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

    console.log("\n▶ Test 1: Admin Creates Product with Variants and Calculated Effective Price");
    const createProdRes = await fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: "Cloud Storage Pro",
        type: "SOFTWARE",
        salesPrice: "3000.00",
        costPrice: "600.00",
        description: "High-performance enterprise cloud storage",
        variants: [
          { name: "1TB Standard", priceAdjustment: "0.00", isActive: true },
          { name: "5TB Premium", priceAdjustment: "1500.00", isActive: true },
        ],
      }),
    });
    assert.strictEqual(createProdRes.status, 201, "Admin should be able to create product (201)");
    const prodData = (await createProdRes.json()) as any;
    const createdProduct = prodData.data.product;
    assert.strictEqual(createdProduct.name, "Cloud Storage Pro");
    assert.strictEqual(createdProduct.variants.length, 2);
    console.log("  ✅ Product with variants created.");

    // Verify calculated effective price in list
    const getProdRes = await fetch(`${BASE_URL}/products/${createdProduct.id}`, {
      headers: { Cookie: adminCookie },
    });
    const singleProdData = (await getProdRes.json()) as any;
    const premiumVariant = singleProdData.data.product.variants.find((v: any) => v.name === "5TB Premium");
    assert.strictEqual(parseFloat(premiumVariant.effectivePrice), 4500.0, "Effective price must equal 3000 + 1500 = 4500");
    console.log(`  ✅ Effective price correctly calculated: ₹${premiumVariant.effectivePrice}`);

    console.log("\n▶ Test 2: RBAC Blocks Non-Admin from Creating Products");
    const forbiddenProdRes = await fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerCookie,
      },
      body: JSON.stringify({
        name: "Unauthorized Product",
        salesPrice: "100.00",
      }),
    });
    assert.strictEqual(forbiddenProdRes.status, 403, "Customer must receive 403 Forbidden");
    console.log("  ✅ Customer blocked by RBAC (403 Forbidden).");

    console.log("\n▶ Test 3: Admin Creates Subscription Plan with Lifecycle Permissions");
    const createPlanRes = await fetch(`${BASE_URL}/plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: "Quarterly Pro Tier",
        description: "Billed every 3 months with pause and early closure permissions",
        price: "7500.00",
        billingFrequency: "MONTHLY",
        billingInterval: 3,
        minQuantity: 1,
        allowPause: true,
        allowEarlyClosure: true,
        allowRenewal: true,
      }),
    });
    assert.strictEqual(createPlanRes.status, 201);
    const planData = (await createPlanRes.json()) as any;
    assert.strictEqual(planData.data.plan.billingInterval, 3);
    assert.strictEqual(planData.data.plan.allowPause, true);
    console.log("  ✅ Subscription plan created with frequency and interval count separation.");

    console.log("\n▶ Test 4: Admin Creates Tax Rule");
    const createTaxRes = await fetch(`${BASE_URL}/taxes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: "State VAT 5%",
        taxRate: "5.00",
        taxType: "PERCENTAGE",
        isDefault: false,
      }),
    });
    assert.strictEqual(createTaxRes.status, 201);
    const taxData = (await createTaxRes.json()) as any;
    assert.strictEqual(taxData.data.taxRule.name, "State VAT 5%");
    console.log("  ✅ Tax rule created successfully.");

    console.log("\n▶ Test 5: Admin Creates Discount Rule and Evaluates Eligibility");
    const createDiscRes = await fetch(`${BASE_URL}/discounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        code: `PROMO_${Date.now()}`,
        name: "Summer Sale 20% Off",
        discountType: "PERCENTAGE",
        value: "20.00",
        minPurchaseAmount: "2000.00",
        maxUsageCount: 50,
      }),
    });
    assert.strictEqual(createDiscRes.status, 201);
    const discData = (await createDiscRes.json()) as any;
    const discountCode = discData.data.discount.code;
    console.log(`  ✅ Discount rule ${discountCode} created.`);

    // Validate eligibility: Subtotal ₹5000 (qualifies) -> 20% discount = ₹1000
    const validDiscountRes = await fetch(`${BASE_URL}/discounts/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerCookie,
      },
      body: JSON.stringify({
        code: discountCode,
        subtotal: "5000.00",
        quantity: 1,
      }),
    });
    assert.strictEqual(validDiscountRes.status, 200);
    const evalData = (await validDiscountRes.json()) as any;
    assert.strictEqual(parseFloat(evalData.data.calculatedAmount), 1000.0);
    assert.strictEqual(parseFloat(evalData.data.newTotal), 4000.0);
    console.log("  ✅ Discount evaluated correctly: ₹5,000 - 20% (₹1,000) = ₹4,000");

    // Validate eligibility: Subtotal ₹1000 (fails minimum order of ₹2000)
    const invalidSubtotalRes = await fetch(`${BASE_URL}/discounts/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerCookie,
      },
      body: JSON.stringify({
        code: discountCode,
        subtotal: "1000.00",
        quantity: 1,
      }),
    });
    assert.strictEqual(invalidSubtotalRes.status, 400, "Should reject below minimum purchase amount");
    console.log("  ✅ Minimum order threshold enforced (400 Bad Request).");

    console.log("\n🎉 ALL PHASE 4 CATALOG, PLANS, TAXES & DISCOUNTS TESTS PASSED!\n");
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
