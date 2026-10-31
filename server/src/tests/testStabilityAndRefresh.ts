import assert from "assert";
import http from "http";
import app from "../app";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { AUTH_COOKIE_NAME, signToken } from "../utils/token";

const TEST_PORT = 5098;
let server: http.Server;

interface RequestOptions {
  method?: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
}

interface ResponseResult {
  status: number;
  headers: http.IncomingHttpHeaders;
  data: any;
}

const makeRequest = (options: RequestOptions): Promise<ResponseResult> => {
  return new Promise((resolve, reject) => {
    const payload = options.body ? JSON.stringify(options.body) : undefined;
    const reqHeaders: Record<string, string> = {
      ...(options.headers || {}),
    };

    if (payload) {
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      {
        hostname: "localhost",
        port: TEST_PORT,
        path: `/api/v1${options.path}`,
        method: options.method || "GET",
        headers: reqHeaders,
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => (rawData += chunk));
        res.on("end", () => {
          let parsedData;
          try {
            parsedData = JSON.parse(rawData);
          } catch {
            parsedData = rawData;
          }
          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            data: parsedData,
          });
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
};

async function runStabilityTests() {
  console.log("\n=======================================================");
  console.log("🧪 RUNNING BRIGHTLOOP STABILITY, AUTH & ERROR HANDLING TESTS");
  console.log("=======================================================\n");

  await new Promise<void>((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`📡 Test server running on port ${TEST_PORT}...\n`);
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Prisma Singleton Verification
    // -------------------------------------------------------------------------
    console.log("▶ Test 1: Prisma Singleton Verification");
    assert.strictEqual(
      prisma,
      globalThis.prismaInstance,
      "prisma must be stored on globalThis.prismaInstance in development/test"
    );
    console.log("  ✅ Prisma singleton verified on globalThis.\n");

    // -------------------------------------------------------------------------
    // TEST 2: Environment Configuration Integrity
    // -------------------------------------------------------------------------
    console.log("▶ Test 2: Environment Configuration Integrity");
    assert.ok(typeof env.PORT === "number", "PORT must be parsed as a number");
    assert.ok(env.JWT_SECRET.length >= 16, "JWT_SECRET must be at least 16 chars");
    assert.ok(env.COOKIE_SECRET.length >= 16, "COOKIE_SECRET must be at least 16 chars");
    assert.ok(env.DATABASE_URL.length > 0, "DATABASE_URL must be configured");
    console.log("  ✅ Environment variables conform to strict Zod schema.\n");

    // -------------------------------------------------------------------------
    // TEST 3: Login and Obtain Valid Session
    // -------------------------------------------------------------------------
    console.log("▶ Test 3: Login to obtain session cookie");
    const loginRes = await makeRequest({
      method: "POST",
      path: "/auth/login",
      body: {
        email: "admin@brightloop.com",
        password: "Admin@123",
      },
    });

    assert.strictEqual(loginRes.status, 200, "Login must succeed with 200 OK");
    assert.ok(loginRes.headers["set-cookie"], "Login must return Set-Cookie header");
    const rawCookie = loginRes.headers["set-cookie"]![0];
    const cookieVal = rawCookie.split(";")[0];
    console.log("  ✅ Login succeeded. Received auth cookie.\n");

    // -------------------------------------------------------------------------
    // TEST 4: Token Refresh Endpoint (/api/v1/auth/refresh)
    // -------------------------------------------------------------------------
    console.log("▶ Test 4: Re-issue session token via POST /auth/refresh");
    const refreshRes = await makeRequest({
      method: "POST",
      path: "/auth/refresh",
      headers: {
        Cookie: cookieVal,
      },
    });

    assert.strictEqual(refreshRes.status, 200, "POST /auth/refresh must succeed with 200 OK");
    assert.strictEqual(refreshRes.data.success, true);
    assert.ok(refreshRes.data.data.token, "Refreshed response must contain new token");
    assert.strictEqual(refreshRes.data.data.user.email, "admin@brightloop.com");
    assert.ok(refreshRes.headers["set-cookie"], "Refresh must return updated Set-Cookie");
    console.log("  ✅ POST /auth/refresh successfully issued fresh token and cookie.\n");

    // -------------------------------------------------------------------------
    // TEST 5: Refresh with Invalid / Missing Token (Should fail cleanly with 401)
    // -------------------------------------------------------------------------
    console.log("▶ Test 5: Reject invalid/missing token on POST /auth/refresh");
    const invalidRefreshRes = await makeRequest({
      method: "POST",
      path: "/auth/refresh",
      headers: {
        Cookie: `${AUTH_COOKIE_NAME}=invalid.bogus.jwt.token`,
      },
    });

    assert.strictEqual(invalidRefreshRes.status, 401, "Invalid refresh must yield 401");
    assert.strictEqual(invalidRefreshRes.data.success, false);
    assert.ok(invalidRefreshRes.data.message, "Error response must include message");
    console.log("  ✅ Invalid refresh correctly rejected with structured 401 response.\n");

    // -------------------------------------------------------------------------
    // TEST 6: Structured 404 Error Handling
    // -------------------------------------------------------------------------
    console.log("▶ Test 6: Verify 404 Route Not Found handling");
    const notFoundRes = await makeRequest({
      method: "GET",
      path: "/non-existent-route-xyz",
    });

    assert.strictEqual(notFoundRes.status, 404);
    assert.strictEqual(notFoundRes.data.success, false);
    assert.ok(typeof notFoundRes.data.message === "string");
    console.log("  ✅ 404 returned consistent JSON: { success: false, message: ... }.\n");

    // -------------------------------------------------------------------------
    // TEST 7: Validation Error (Zod) Formatted Response
    // -------------------------------------------------------------------------
    console.log("▶ Test 7: Verify schema validation error handling");
    const validationErrRes = await makeRequest({
      method: "POST",
      path: "/auth/login",
      body: {
        email: "not-an-email",
        // missing password
      },
    });

    assert.ok(validationErrRes.status === 400 || validationErrRes.status === 422);
    assert.strictEqual(validationErrRes.data.success, false);
    console.log("  ✅ Validation error returned consistent structured payload.\n");

    console.log("=======================================================");
    console.log("🎉 ALL STABILITY, REFRESH & ERROR TESTS PASSED CLEANLY!");
    console.log("=======================================================\n");
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
    await prisma.$disconnect();
  }
}

runStabilityTests().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
