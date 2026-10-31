import assert from "assert";
import http from "http";
import app from "../app";
import { prisma } from "../lib/prisma";

const PORT = 5099;

async function runTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`🧪 Test server running on port ${PORT}...`);

  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  try {
    console.log("\n▶ Test 1: Admin Login with valid credentials");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@brightloop.com",
        password: "Admin@BrightLoop2026!",
      }),
    });
    assert.strictEqual(loginRes.status, 200, "Login should return 200");
    const loginData = (await loginRes.json()) as any;
    assert.strictEqual(loginData.success, true);
    assert.strictEqual(loginData.data.user.role, "ADMIN");
    const setCookie = loginRes.headers.get("set-cookie");
    assert(setCookie && setCookie.includes("brightloop_token"), "Must set brightloop_token cookie");
    console.log("  ✅ Admin login passed. Cookie set.");

    const tokenCookie = setCookie.split(";")[0];

    console.log("\n▶ Test 2: Access GET /auth/me with Cookie");
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Cookie: tokenCookie },
    });
    assert.strictEqual(meRes.status, 200);
    const meData = (await meRes.json()) as any;
    assert.strictEqual(meData.data.user.email, "admin@brightloop.com");
    assert.strictEqual(meData.data.user.role, "ADMIN");
    console.log("  ✅ GET /auth/me authenticated successfully.");

    console.log("\n▶ Test 3: Reject Unauthenticated GET /auth/me");
    const unauthRes = await fetch(`${BASE_URL}/auth/me`);
    assert.strictEqual(unauthRes.status, 401, "Should reject unauthenticated request with 401");
    console.log("  ✅ Unauthenticated request correctly rejected (401).");

    console.log("\n▶ Test 4: Admin creates Staff account");
    const testStaffEmail = `staff_test_${Date.now()}@brightloop.com`;
    const createStaffRes = await fetch(`${BASE_URL}/users/staff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: tokenCookie,
      },
      body: JSON.stringify({
        name: "Test Staff Member",
        email: testStaffEmail,
        password: "Staff@BrightLoop2026!",
      }),
    });
    assert.strictEqual(createStaffRes.status, 201, "Admin should be able to create staff (201)");
    const createStaffData = (await createStaffRes.json()) as any;
    assert.strictEqual(createStaffData.data.staff.role, "STAFF");
    console.log("  ✅ Admin created staff account successfully.");

    console.log("\n▶ Test 5: Register new Customer Account");
    const testCustomerEmail = `customer_test_${Date.now()}@testcorp.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice Founder",
        email: testCustomerEmail,
        password: "Customer@BrightLoop2026!",
        companyName: "Innovate AI Corp",
        phone: "+91 9999888877",
      }),
    });
    assert.strictEqual(regRes.status, 201, "Customer registration should succeed (201)");
    const regData = (await regRes.json()) as any;
    assert.strictEqual(regData.data.user.role, "CUSTOMER");
    assert.strictEqual(regData.data.customer.companyName, "Innovate AI Corp");
    const customerCookie = regRes.headers.get("set-cookie")?.split(";")[0] || "";
    console.log("  ✅ Customer registered with linked commercial profile.");

    console.log("\n▶ Test 6: Non-Admin (Customer) is blocked from creating Staff (RBAC check)");
    const forbiddenStaffRes = await fetch(`${BASE_URL}/users/staff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerCookie,
      },
      body: JSON.stringify({
        name: "Hacker Staff",
        email: "hacker@test.com",
        password: "Hacker@Password2026!",
      }),
    });
    assert.strictEqual(forbiddenStaffRes.status, 403, "Customer must be forbidden from creating staff (403)");
    console.log("  ✅ RBAC blocked non-admin from creating staff (403 Forbidden).");

    console.log("\n▶ Test 7: Reject Weak Password on Registration");
    const weakPassRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Weak Pass User",
        email: `weak_${Date.now()}@test.com`,
        password: "weak", // fails min length, uppercase, special char
        companyName: "Weak Corp",
      }),
    });
    assert.strictEqual(weakPassRes.status, 400, "Should reject weak password with 400");
    console.log("  ✅ Weak password rejected with 400 Bad Request.");

    console.log("\n▶ Test 8: Logout clears session cookie");
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { Cookie: customerCookie },
    });
    assert.strictEqual(logoutRes.status, 200);
    const logoutCookie = logoutRes.headers.get("set-cookie");
    assert(logoutCookie && logoutCookie.includes("brightloop_token="), "Must clear cookie");
    console.log("  ✅ Logout succeeded and cleared auth cookie.");

    console.log("\n🎉 ALL AUTHENTICATION & RBAC TESTS PASSED SUCCESSFULLY!\n");
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
