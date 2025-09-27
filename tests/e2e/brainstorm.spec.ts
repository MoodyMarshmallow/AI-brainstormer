import { test, expect, type Page } from '@playwright/test';

const sessionTitle = () => `E2E Session ${Date.now()}`;
const promptText = () => `E2E Prompt ${Date.now()}`;

async function createSession(page: Page): Promise<string> {
  const title = sessionTitle();

  await page.goto('/');
  await page.getByPlaceholder('Session title').fill(title);

  const navigationPromise = page.waitForURL('**/s/*', { timeout: 15_000 });
  await page.getByRole('button', { name: 'Create Brainstorm' }).click();
  await navigationPromise;

  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  return title;
}

async function triggerBrainstorm(page: Page, prompt: string): Promise<void> {
  const responsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/brainstorm') && response.request().method() === 'POST'
  );

  await page.getByPlaceholder('Ask a question or propose an idea...').fill(prompt);
  await page.getByRole('button', { name: 'Brainstorm' }).click();
  await responsePromise;
}

test.describe('Brainstorm sessions', () => {
  test('create, brainstorm, list, and delete session', async ({ page }) => {
    const title = await createSession(page);

    // Verify the session appears in the sidebar on the share page.
    const sidebarLink = page.getByRole('link', { name: new RegExp(title) });
    await expect(sidebarLink).toBeVisible();

    // Generate persona replies for the session.
    const prompt = promptText();
    await triggerBrainstorm(page, prompt);

    // Persona nodes should appear (fallback content if Gemini unavailable).
    await expect(page.getByRole('button', { name: /Optimist/i })).toContainText('Optimist');
    await expect(page.getByRole('button', { name: /Pessimist/i })).toContainText('Pessimist');
    await expect(page.getByRole('button', { name: /Realist/i })).toContainText('Realist');

    // Return to the home page to validate listing + deletion.
    await page.goto('/');

    const listItem = page.getByRole('link', { name: new RegExp(title) });
    await expect(listItem).toBeVisible();

    const deleteButton = listItem.locator('button[aria-label="Delete session"]');
    await listItem.hover();
    await expect(deleteButton).toBeVisible();

    const deleteResponse = page.waitForResponse((response) =>
      response.url().includes('/api/sessions/') && response.request().method() === 'DELETE'
    );
    await deleteButton.click();
    await deleteResponse;

    await expect(listItem).toHaveCount(0);
  });
});
