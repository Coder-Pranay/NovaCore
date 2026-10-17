import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const API = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8080/api";
const DEMO = {
  email: `qa.${Date.now()}@novacore.test`,
  username: `qa${Date.now().toString().slice(-8)}`,
  password: "Secret123!",
  firstName: "QA",
  lastName: "Auditor",
};

type ConsoleBucket = {
  errors: string[];
  warnings: string[];
  pageErrors: string[];
  failedRequests: Array<{ url: string; status: number }>;
  apiCalls: Array<{ method: string; url: string; status: number; ms: number }>;
};

function attachObservers(page: Page): ConsoleBucket {
  const bucket: ConsoleBucket = {
    errors: [],
    warnings: [],
    pageErrors: [],
    failedRequests: [],
    apiCalls: [],
  };

  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") bucket.errors.push(text);
    if (msg.type() === "warning") bucket.warnings.push(text);
  });

  page.on("pageerror", (err) => {
    bucket.pageErrors.push(err.message);
  });

  page.on("response", (response) => {
    const url = response.url();
    const status = response.status();
    const timing = response.request().timing();
    const ms = timing ? Math.max(0, timing.responseEnd) : 0;

    if (url.includes("/api/")) {
      bucket.apiCalls.push({
        method: response.request().method(),
        url,
        status,
        ms,
      });
    }

    if (status >= 400) {
      // Ignore expected 401 on invalid login tests if marked later.
      bucket.failedRequests.push({ url, status });
    }
  });

  return bucket;
}

async function registerUser(request: APIRequestContext) {
  const response = await request.post(`${API}/v1/auth/register`, {
    data: DEMO,
  });
  expect(response.status(), await response.text()).toBe(201);
}

async function loginViaUi(page: Page, identity = DEMO.email, password = DEMO.password) {
  await page.goto("/login");
  await page.getByLabel(/email or username/i).fill(identity);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/);
}

test.describe.configure({ mode: "serial" });

test.describe("NovaCore QA audit", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${API}/actuator/health`);
    expect(health.ok(), "Backend must be healthy for E2E").toBeTruthy();
    await registerUser(request);
  });

  test("public routes render without JS crashes", async ({ page }) => {
    const obs = attachObservers(page);
    for (const path of ["/", "/login", "/unauthorized", "/offline"]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
    }
    expect(obs.pageErrors, obs.pageErrors.join("\n")).toEqual([]);
  });

  test("protected routes redirect unauthenticated users to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("next=");
  });

  test("invalid login shows error and stays on login", async ({ page }) => {
    const obs = attachObservers(page);
    await page.goto("/login");
    await page.getByLabel(/email or username/i).fill("nobody@novacore.test");
    await page.getByLabel(/^password$/i).fill("WrongPass1!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.waitForTimeout(800);
    const authFail = obs.failedRequests.some(
      (r) => r.url.includes("/v1/auth/login") && r.status === 401,
    );
    expect(authFail).toBeTruthy();
  });

  test("login validation blocks empty submit", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/required|email|password/i).first()).toBeVisible();
  });

  test("successful login reaches dashboard widgets", async ({ page }) => {
    const obs = attachObservers(page);
    await loginViaUi(page);
    await expect(page.getByRole("heading", { name: /welcome|dashboard/i }).or(page.locator("text=Quick actions")).first()).toBeVisible({ timeout: 20_000 });
    expect(obs.pageErrors, obs.pageErrors.join("\n")).toEqual([]);
    const notFoundAssets = obs.failedRequests.filter((r) =>
      r.url.includes("/assets") && r.status === 404,
    );
    expect(notFoundAssets, JSON.stringify(notFoundAssets)).toEqual([]);
  });

  test("session cookie persists across reload", async ({ page }) => {
    await loginViaUi(page);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("navigation", { name: /primary/i })).toBeVisible();
  });

  const privatePaths = [
    "/dashboard",
    "/spaces",
    "/assets",
    "/favorites",
    "/shared",
    "/search",
    "/notifications",
    "/analytics",
    "/storage",
    "/settings",
    "/profile",
    "/ai",
  ];

  for (const path of privatePaths) {
    test(`module route ${path} loads without page crash`, async ({ page }) => {
      const obs = attachObservers(page);
      await loginViaUi(page);
      const response = await page.goto(path);
      expect(response?.status(), path).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
      expect(obs.pageErrors, `${path}: ${obs.pageErrors.join("\n")}`).toEqual([]);
      const html404 = obs.failedRequests.filter(
        (r) =>
          r.status === 404 &&
          r.url.includes("localhost:3000") &&
          !r.url.includes("/api/"),
      );
      expect(html404, `${path} frontend 404s: ${JSON.stringify(html404)}`).toEqual([]);
    });
  }

  test("spaces create + search smoke", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/spaces");
    const createBtn = page.getByRole("button", { name: /create space/i });
    if (await createBtn.isVisible()) {
      await createBtn.click();
      const name = `QA Space ${Date.now()}`;
      await page.getByLabel(/^name$/i).fill(name);
      await page.getByRole("button", { name: /create|save/i }).last().click();
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });
      await page.getByLabel(/search spaces/i).fill(name);
      await expect(page.getByText(name).first()).toBeVisible();
    }
  });

  test("search page keyboard and empty state", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/search");
    await page.getByLabel(/search novacore/i).fill("zz");
    await expect(page.getByText(/at least 2 characters|no results|spaces/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("settings and theme toggle", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
    const theme = page.getByRole("button", { name: /toggle theme|theme/i }).first();
    if (await theme.isVisible()) {
      await theme.click();
      await page.getByRole("menuitem", { name: /dark/i }).click();
      await expect(page.locator("html")).toHaveClass(/dark/);
    }
  });

  test("AI assistant shows unavailable state without crashing", async ({ page }) => {
    const obs = attachObservers(page);
    await loginViaUi(page);
    await page.goto("/ai");
    await expect(
      page.getByRole("heading", { name: /assistant is not available yet/i }),
    ).toBeVisible();
    expect(obs.pageErrors).toEqual([]);
  });

  test("public share link landing does not 404", async ({ page }) => {
    const response = await page.goto("/shared/link/qa-token-123");
    expect(response?.status()).toBeLessThan(400);
    await expect(
      page.getByRole("heading", { name: /share not found|password required/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("assets page loads and is not a coming soon stub", async ({ page }) => {
    await loginViaUi(page);
    const response = await page.goto("/assets");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { name: "Assets" })).toBeVisible();
    await expect(page.getByText(/coming soon/i)).toHaveCount(0);
  });

  test("logout returns to login and blocks dashboard", async ({ page }) => {
    await loginViaUi(page);
    await page.getByRole("button", { name: /account|user|profile|avatar/i }).first().click().catch(() => undefined);
    const logout = page.getByRole("menuitem", { name: /log out|sign out/i }).or(
      page.getByRole("button", { name: /log out|sign out/i }),
    );
    if (await logout.first().isVisible()) {
      await logout.first().click();
      await page.waitForURL(/\/login/);
      await page.goto("/dashboard");
      await page.waitForURL(/\/login/);
    }
  });
});
