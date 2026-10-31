import assert from "node:assert";
import http from "node:http";
import app from "../app";

const PORT = 5101;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log("🧪 Starting Phase 9: Financial Analytics & Reporting Integration Tests...\n");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`🧪 Reports Test server running on port ${PORT}...`);

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

    // TEST 1: Staff Financial Analytics Access
    console.log("Test 1: Staff Access to Executive Financial Analytics...");
    const analyticsRes = await fetch(`${BASE_URL}/reports/analytics`, {
      headers: { Cookie: staffCookie },
    });
    assert.strictEqual(analyticsRes.status, 200, "Analytics must return 200 OK for Staff");
    const analyticsData = (await analyticsRes.json()) as any;
    const data = analyticsData.data;

    assert("mrr" in data, "Must include MRR");
    assert("arr" in data, "Must include ARR");
    assert("activeSubscriptions" in data, "Must include activeSubscriptions");
    assert("churnRate" in data, "Must include churnRate");
    assert("agingBuckets" in data, "Must include agingBuckets");
    assert("under30Days" in data.agingBuckets, "Aging must have under30Days");
    assert("over90Days" in data.agingBuckets, "Aging must have over90Days");
    assert("recentActivity" in data, "Must include recentActivity");

    console.log(`✅ Passed: Analytics retrieved: MRR=$${data.mrr}, ARR=$${data.arr}, Active=${data.activeSubscriptions}, Churn=${data.churnRate}`);

    // TEST 2: RBAC Protection - Customer Access Denied
    console.log("\nTest 2: Customer Access Denied (RBAC)...");
    const customerRes = await fetch(`${BASE_URL}/reports/analytics`, {
      headers: { Cookie: customerCookie },
    });
    assert.strictEqual(customerRes.status, 403, "Customer must be rejected with 403 Forbidden");
    console.log("✅ Passed: Customer correctly denied access to administrative financial analytics.");

    // TEST 3: Unauthenticated Access Denied
    console.log("\nTest 3: Unauthenticated Access Denied...");
    const unauthRes = await fetch(`${BASE_URL}/reports/analytics`);
    assert.strictEqual(unauthRes.status, 401, "Unauthenticated request must return 401 Unauthorized");
    console.log("✅ Passed: Unauthenticated request rejected.");

    console.log("\n🎉 ALL 3 REPORTING & ANALYTICS INTEGRATION TESTS PASSED WITH 100% SUCCESS!\n");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
