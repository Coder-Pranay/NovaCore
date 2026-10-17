import { test, expect } from "@playwright/test";
import path from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import os from "node:os";

const API = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8080/api";

function uniqueUser(prefix = "asset") {
  const stamp = Date.now().toString().slice(-8);
  return {
    firstName: "Asset",
    lastName: "User",
    username: `${prefix}${stamp}`,
    email: `${prefix}.${stamp}@novacore.test`,
    password: "Secret123!",
  };
}

test.describe("Assets page", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${API}/actuator/health`);
    expect(health.ok(), "Backend must be healthy for assets E2E").toBeTruthy();
  });

  test("lists assets and supports upload + delete", async ({ page, request }) => {
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
    await page.waitForURL(/\/dashboard/);

    // Create a space via UI API cookies after login
    const createSpace = await page.request.post(`${API}/v1/spaces`, {
      data: {
        name: `Assets Space ${Date.now()}`,
        type: "BLANK",
      },
    });
    expect(createSpace.ok(), await createSpace.text()).toBeTruthy();

    await page.goto("/assets");
    await expect(page.getByRole("heading", { name: "Assets" })).toBeVisible();
    await expect(page.getByText(/no assets yet|0 assets/i).first()).toBeVisible();

    const tmpDir = path.join(os.tmpdir(), "novacore-e2e");
    mkdirSync(tmpDir, { recursive: true });
    const filePath = path.join(tmpDir, "novacore-upload.txt");
    writeFileSync(filePath, `nova upload ${Date.now()}`);

    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.getByRole("button", { name: /^upload$/i }).click();

    await expect(
      page.getByRole("cell", { name: /novacore-upload\.txt/i }).first(),
    ).toBeVisible({ timeout: 30_000 });

    const viewButton = page.getByRole("button", { name: /view novacore-upload/i });
    const downloadButton = page.getByRole("button", {
      name: /download novacore-upload/i,
    });
    await expect(viewButton).toBeEnabled();
    await expect(downloadButton).toBeEnabled();

    const download = page.waitForEvent("download");
    await downloadButton.click();
    expect((await download).suggestedFilename()).toMatch(/novacore-upload\.txt/i);

    await viewButton.click();
    await expect(page.getByRole("dialog")).toContainText(/preview isn't available/i);
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: /delete novacore-upload/i }).click();
    const deleteDialog = page.getByRole("dialog");
    await expect(deleteDialog).toContainText(/delete asset/i);
    await deleteDialog.getByRole("button", { name: /^delete$/i }).click();

    await expect(page.getByText(/no assets yet/i)).toBeVisible({ timeout: 15_000 });
  });
});
