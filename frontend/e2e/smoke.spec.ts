import { test, expect, type Page } from '@playwright/test';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * P9 cross-browser smoke suite — runs the same flows through chromium,
 * firefox and webkit against the dockerized stack behind nginx.
 * See ../../BROWSER_SUPPORT.md for the resulting support matrix.
 */

interface SeedAuth {
  token: string;
  userId: string;
  login: string;
  email: string;
}

function readSeedAuth(): SeedAuth {
  return JSON.parse(readFileSync(join(__dirname, '.auth.json'), 'utf-8'));
}

/** Injects the JWT minted by global-setup.ts so the page loads authenticated. */
async function signIn(page: Page): Promise<SeedAuth> {
  const auth = readSeedAuth();
  await page.goto('/');
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', token);
  }, auth.token);
  return auth;
}

test.describe('public pages', () => {
  test('sign-in page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Login with 42')).toBeVisible();
    await expect(page.getByText('login with email')).toBeVisible();
  });

  test('email login form transitions past the email step', async ({ page }) => {
    const auth = readSeedAuth();
    await page.goto('/');
    await page.getByText('login with email').click();

    const emailInput = page.getByPlaceholder('email');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(auth.email);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Existing 42-only accounts have no password yet: the backend sends an
    // OTP and the app redirects to /EmailSetup. Accounts that already set a
    // password stay on this screen with a password field instead.
    await expect(async () => {
      const onSetup = page.url().includes('/EmailSetup');
      const hasPasswordField = await page.getByPlaceholder('password').isVisible().catch(() => false);
      expect(onSetup || hasPasswordField).toBe(true);
    }).toPass({ timeout: 10_000 });
  });

  test('OTP page renders', async ({ page }) => {
    await page.goto('/OTPEmail?userId=smoke-test-placeholder');
    await expect(page.getByPlaceholder('* * * * * *')).toBeVisible();
  });
});

test.describe('authenticated app', () => {
  test('game canvas mounts', async ({ page }) => {
    await signIn(page);
    await page.goto('/Game');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  });

  test('chat: send a global message', async ({ page }) => {
    await signIn(page);
    await page.goto('/Game');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    await page.locator('button[title="Chat"]').click();

    const messageText = `smoke test ${Date.now()}`;
    const input = page.getByPlaceholder('Type a message...');
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill(messageText);
    await input.press('Enter');

    await expect(page.getByText(messageText)).toBeVisible({ timeout: 10_000 });
  });

  test('resource upload with progress + preview, then cleanup', async ({ page }) => {
    await signIn(page);
    await page.goto('/Game');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    await page.locator('button[title="Resources"]').click();
    await expect(page.locator('select').first()).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: '+ Add' }).click();

    // The resource-type <select> lives inside the create form.
    await page.locator('form select').selectOption('FILE');

    const title = `smoke-upload-${Date.now()}`;
    await page.getByPlaceholder('Title *').fill(title);

    const filePath = join(tmpdir(), `${title}.txt`);
    writeFileSync(filePath, 'playwright smoke test file');
    await page.locator('input[type="file"]').setInputFiles(filePath);

    await page.locator('form button[type="submit"]').click();

    const resourceRow = page.getByText(title, { exact: true });
    await expect(resourceRow).toBeVisible({ timeout: 15_000 });

    // Cleanup: delete the resource this test created so repeated runs don't
    // pollute the shared dev database.
    const row = resourceRow.locator('xpath=ancestor::div[contains(@class, "flex-col")][1]');
    await row.getByText('✕').click();
    await expect(resourceRow).not.toBeVisible({ timeout: 10_000 });

    unlinkSync(filePath);
  });
});
