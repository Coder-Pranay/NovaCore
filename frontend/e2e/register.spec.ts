import { expect, test, type Page } from "@playwright/test";

const API = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8080/api";

function uniqueUser(prefix = "reg") {
  const stamp = Date.now().toString().slice(-8);
  return {
    firstName: "Reg",
    lastName: "User",
    username: `${prefix}${stamp}`,
    email: `${prefix}.${stamp}@novacore.test`,
    password: "Secret123!",
  };
}

async function fillRegisterForm(
  page: Page,
  user: ReturnType<typeof uniqueUser>,
  options?: { confirmPassword?: string; skipPassword?: boolean },
) {
  await page.getByLabel(/^first name$/i).fill(user.firstName);
  await page.getByLabel(/^last name$/i).fill(user.lastName);
  await page.getByLabel(/^username$/i).fill(user.username);
  await page.getByLabel(/^email$/i).fill(user.email);
  if (!options?.skipPassword) {
    await page.getByLabel(/^password$/i).fill(user.password);
    await page
      .getByLabel(/^confirm password$/i)
      .fill(options?.confirmPassword ?? user.password);
  }
}

test.describe("Registration", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${API}/actuator/health`);
    expect(health.ok(), "Backend must be healthy for registration E2E").toBeTruthy();
  });

  test("successful registration redirects to login", async ({ page }) => {
    const user = uniqueUser("ok");
    await page.goto("/register");
    await fillRegisterForm(page, user);
    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForURL(/\/login/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

    await page.getByLabel(/email or username/i).fill(user.email);
    await page.getByLabel(/^password$/i).fill(user.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
  });

  test("client validation blocks empty submit", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText(/required|valid email|at least/i).first()).toBeVisible();
  });

  test("password confirmation mismatch is shown", async ({ page }) => {
    const user = uniqueUser("pwd");
    await page.goto("/register");
    await fillRegisterForm(page, user, { confirmPassword: "Different123!" });
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test("duplicate email shows conflict error", async ({ page, request }) => {
    const user = uniqueUser("dup");
    const create = await request.post(`${API}/v1/auth/register`, {
      data: {
        email: user.email,
        username: user.username,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
    expect(create.status()).toBe(201);

    await page.goto("/register");
    await fillRegisterForm(page, {
      ...user,
      username: `${user.username}x`,
    });

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/v1/auth/register") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: /create account/i }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(409);

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByTestId("register-form-error")).toContainText(
      /email already registered/i,
    );
  });

  test("login page links to create account", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
  });
});
