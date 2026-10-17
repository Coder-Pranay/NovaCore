import { expect, test } from "@playwright/test";

const API = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8080/api";

function uniqueUser(prefix = "cookie") {
  const stamp = Date.now().toString().slice(-8);
  return {
    firstName: "Cookie",
    lastName: "Auth",
    username: `${prefix}${stamp}`,
    email: `${prefix}.${stamp}@novacore.test`,
    password: "Secret123!",
  };
}

test.describe("HttpOnly cookie authentication", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${API}/actuator/health`);
    expect(health.ok(), "Backend must be healthy for cookie auth E2E").toBeTruthy();
  });

  test("login stores HttpOnly cookies and never writes JWTs to localStorage", async ({
    page,
    request,
  }) => {
    const user = uniqueUser("ui");

    await request.post(`${API}/v1/auth/register`, {
      data: {
        email: user.email,
        username: user.username,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

    await page.goto("/login");
    await page.getByLabel(/email or username/i).fill(user.email);
    await page.getByLabel(/^password$/i).fill(user.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });

    const localStorageDump = await page.evaluate(() => JSON.stringify(window.localStorage));
    expect(localStorageDump).not.toMatch(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    expect(localStorageDump).not.toContain("accessToken");
    expect(localStorageDump).not.toContain("refreshToken");

    const cookies = await page.context().cookies();
    const access = cookies.find((c) => c.name === "novacore_access");
    const refresh = cookies.find((c) => c.name === "novacore_refresh");
    const session = cookies.find((c) => c.name === "novacore_session");

    expect(access?.httpOnly).toBe(true);
    expect(refresh?.httpOnly).toBe(true);
    expect(session?.httpOnly).toBe(true);
    expect(access?.sameSite?.toLowerCase()).toBe("lax");

    await page.goto("/spaces");
    await expect(page).toHaveURL(/\/spaces/);
  });

  test("logout clears auth cookies", async ({ page, request }) => {
    const user = uniqueUser("out");

    await request.post(`${API}/v1/auth/register`, {
      data: {
        email: user.email,
        username: user.username,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

    await page.goto("/login");
    await page.getByLabel(/email or username/i).fill(user.username);
    await page.getByLabel(/^password$/i).fill(user.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });

    // Prefer explicit logout control if present; otherwise hit API + clear UI.
    const logoutButton = page.getByRole("button", { name: /sign out|log out|logout/i });
    if (await logoutButton.count()) {
      await logoutButton.first().click();
    } else {
      await page.request.post(`${API}/v1/auth/logout`, { data: {} });
      await page.goto("/login");
    }

    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });

    const cookies = await page.context().cookies();
    const access = cookies.find((c) => c.name === "novacore_access");
    const refresh = cookies.find((c) => c.name === "novacore_refresh");
    expect(!access || access.value === "" || access.expires === -1).toBeTruthy();
    expect(!refresh || refresh.value === "" || refresh.expires === -1).toBeTruthy();
  });
});
