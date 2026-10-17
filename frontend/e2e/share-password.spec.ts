import { expect, test, type APIRequestContext } from "@playwright/test";

const API = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8080/api";

function uniqueUser(prefix = "share") {
  const stamp = Date.now().toString().slice(-8);
  return {
    firstName: "Share",
    lastName: "Owner",
    username: `${prefix}${stamp}`,
    email: `${prefix}.${stamp}@novacore.test`,
    password: "Secret123!",
  };
}

async function registerLoginAndCreateProtectedLink(
  request: APIRequestContext,
  options?: { passwordProtected?: boolean; password?: string },
) {
  const user = uniqueUser();
  const passwordProtected = options?.passwordProtected ?? true;
  const sharePassword = options?.password ?? "ShareLock1!";

  const register = await request.post(`${API}/v1/auth/register`, {
    data: {
      email: user.email,
      username: user.username,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
  expect(register.ok()).toBeTruthy();

  const login = await request.post(`${API}/v1/auth/login`, {
    data: {
      emailOrUsername: user.username,
      password: user.password,
    },
  });
  expect(login.ok()).toBeTruthy();
  const loginBody = await login.json();
  expect(loginBody.data.accessToken).toBeUndefined();
  expect(loginBody.data.refreshToken).toBeUndefined();

  // Playwright request context stores HttpOnly Set-Cookie values automatically.
  const space = await request.post(`${API}/v1/spaces`, {
    data: {
      name: `Shared ${user.username}`,
      type: "BLANK",
    },
  });
  expect(space.ok()).toBeTruthy();
  const spaceBody = await space.json();
  const spaceId = spaceBody.data.id as string;
  const spaceName = spaceBody.data.name as string;

  const link = await request.post(`${API}/v1/public-links`, {
    data: {
      resourceType: "SPACE",
      resourceId: spaceId,
      resourceName: spaceName,
      passwordProtected,
      password: passwordProtected ? sharePassword : undefined,
    },
  });
  expect(link.ok()).toBeTruthy();
  const linkBody = await link.json();

  return {
    user,
    spaceId,
    spaceName,
    sharePassword,
    token: linkBody.data.token as string,
    passwordProtected: Boolean(linkBody.data.passwordProtected),
  };
}

test.describe("Password-protected public shares", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${API}/actuator/health`);
    expect(health.ok(), "Backend must be healthy for share password E2E").toBeTruthy();
  });

  test("prompts for password and unlocks with the correct password", async ({
    page,
    request,
  }) => {
    const share = await registerLoginAndCreateProtectedLink(request);

    await page.goto(`/shared/link/${share.token}`);
    await expect(page.getByRole("heading", { name: /password required/i })).toBeVisible();
    await expect(page.getByText(share.spaceName)).toBeVisible();

    await page.getByLabel(/share password/i).fill("WrongPass99!");
    await page.getByRole("button", { name: /^unlock$/i }).click();
    await expect(page.getByText(/invalid password/i)).toBeVisible();

    await page.getByLabel(/share password/i).fill(share.sharePassword);
    await page.getByRole("button", { name: /^unlock$/i }).click();
    await expect(page.getByRole("heading", { name: share.spaceName })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/shared space via public link/i)).toBeVisible();
  });

  test("invalid token shows not found (not content)", async ({ page }) => {
    await page.goto("/shared/link/this-token-does-not-exist");
    await expect(page.getByRole("heading", { name: /share not found/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("preview cannot bypass password from the browser", async ({ page, request }) => {
    const share = await registerLoginAndCreateProtectedLink(request);

    const preview = await request.get(`${API}/v1/public-links/open/${share.token}`);
    expect(preview.ok()).toBeTruthy();
    const previewBody = await preview.json();
    expect(previewBody.data.passwordRequired).toBe(true);
    expect(previewBody.data.resourceId).toBeUndefined();

    const denied = await request.post(`${API}/v1/public-links/open/${share.token}`, {
      data: {},
    });
    expect(denied.status()).toBe(401);

    await page.goto(`/shared/link/${share.token}`);
    await expect(page.getByRole("heading", { name: /password required/i })).toBeVisible();
    await expect(page.getByText(share.spaceId)).toHaveCount(0);
  });

  test("unprotected link opens without a password prompt", async ({ page, request }) => {
    const share = await registerLoginAndCreateProtectedLink(request, {
      passwordProtected: false,
    });

    await page.goto(`/shared/link/${share.token}`);
    await expect(page.getByRole("button", { name: /open shared content/i })).toBeVisible();
    await page.getByRole("button", { name: /open shared content/i }).click();
    await expect(page.getByRole("heading", { name: share.spaceName })).toBeVisible({
      timeout: 15_000,
    });
  });
});
