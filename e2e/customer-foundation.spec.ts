import { expect, test, type Locator } from "@playwright/test";
const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
async function expectReadable(locator: Locator) {
  const contrast = await locator.evaluate(element => {
    const channels = (value: string) => (value.match(/[\d.]+/g) || []).map(Number);
    const luminance = (rgb: number[]) => rgb.slice(0, 3).reduce((sum, value, index) => {
      const channel = value / 255;
      return sum + (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][index];
    }, 0);
    let parent: Element | null = element;
    let background = [255, 255, 255];
    while (parent) {
      const candidate = channels(getComputedStyle(parent).backgroundColor);
      if (candidate.length === 3 || candidate[3] === 1) { background = candidate; break; }
      parent = parent.parentElement;
    }
    const foreground = luminance(channels(getComputedStyle(element).color));
    const behind = luminance(background);
    return (Math.max(foreground, behind) + 0.05) / (Math.min(foreground, behind) + 0.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
}
test.beforeAll(async ({ request }) => {
  // Qualify database startup before measuring interactions on the ready store.
  expect((await request.get('/api/copilot/products?ids=B010')).ok()).toBe(true);
});
for (const width of [1280, 390]) {
  test(`manual shopping, identity recovery and keyboard navigation at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/search?filters=" + encodeURIComponent(JSON.stringify({ query: "Sony", sort: "price_asc", limit: 4 })));
    const surface = page.locator('.concierge-page');
    await expect(surface).toHaveAttribute('data-ready', 'true');
    const card = surface.locator('article').filter({ has: page.getByRole('button', { name: 'Add to cart', exact: true, disabled: false }) }).first();
    await expect(card).toBeVisible();
    const productId = await card.getAttribute('data-product-id');
    const detailsResponse = await page.request.get('/api/copilot/products?ids=' + productId);
    expect(detailsResponse.ok()).toBe(true);
    const product = (await detailsResponse.json()).products[0];
    await card.getByRole('link').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(product.name);
    await expect(page.locator('.pdp-desc')).toHaveText(product.description);
    for (const specification of product.specs)
      await expect(page.locator('.pdp-page .product-facts')).toContainText(specification);
    if (product.source.startsWith('https://'))
      await expect(page.getByRole('link', { name: 'Manufacturer source', exact: false })).toHaveAttribute('href', product.source);
    await expect(page.locator('.pdp-price-value')).toHaveText(new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price / 100));
    for (const selector of ['.pdp-title', '.pdp-price-value', '.pdp-desc'])
      await expectReadable(page.locator(selector));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const photograph = page.locator('.pdp-visual-pane img').first();
    await expect(photograph).toBeVisible();
    await expect.poll(() => photograph.evaluate(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`product-${width}.png`) });
    await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
    await expect(page.getByRole('link', { name: 'View cart', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Save to wishlist', exact: true }).click();
    await expect(page.getByRole('link', { name: 'View wishlist', exact: true })).toBeVisible();
    const owner = (await (await page.request.get('/api/session')).json()).actor;
    await page.getByRole('link', { name: 'View cart', exact: true }).click();
    await expect(surface.locator('article')).toHaveCount(1);
    await page.getByLabel('Quantity ' + productId, { exact: true }).fill('2');
    await expect.poll(async () => (await (await page.request.get('/api/copilot/state')).json()).basket.cart[0].quantity).toBe(2);
    await page.reload();
    await expect(page.getByLabel('Quantity ' + productId, { exact: true })).toHaveValue('2');
    expect((await (await page.request.get('/api/session')).json()).actor).toEqual(owner);
    await page.getByLabel('Quantity ' + productId, { exact: true }).fill('100');
    await expect(surface.getByRole('alert')).toContainText('Please check the request fields.');
    expect((await (await page.request.get('/api/copilot/state')).json()).basket.cart[0].quantity).toBe(2);
    await page.reload();
    await expect(page.getByLabel('Quantity ' + productId, { exact: true })).toHaveValue('2');
    const menu = page.getByLabel('Main menu', { exact: true });
    await menu.focus();
    await page.keyboard.press('Enter');
    const nav = page.getByRole('navigation', { name: 'Main navigation', exact: true });
    await expect(nav.getByRole('link', { name: 'Wishlist', exact: true })).toBeVisible();
    for (let step = 0; step < 8; step++) await page.keyboard.press('Tab');
    await expect(nav.getByRole('button', { name: 'Account / sign in', exact: true })).toBeFocused();
    expect(await nav.getByRole('button', { name: 'Account / sign in', exact: true }).evaluate(e => getComputedStyle(e).outlineStyle)).not.toBe('none');
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Name', { exact: true })).toBeFocused();
    expect(await page.getByLabel('Name', { exact: true }).evaluate(e => getComputedStyle(e).outlineStyle)).not.toBe('none');
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(menu).toBeFocused();
    // Use the same visible account entry to convert the guest without changing identity.
    await menu.click();
    await nav.getByRole('button', { name: 'Account / sign in', exact: true }).click();
    const email = `m1-${width}-${Date.now()}@example.test`;
    await page.getByLabel('Name', { exact: true }).fill('M1 customer');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill('m1-private-passphrase-42');
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    expect((await (await page.request.get('/api/session')).json()).actor).toEqual(owner);
    await page.getByRole('button', { name: /Shopper.*Sign out/ }).click();
    await expect(page.getByRole('button', { name: 'Start shopping', exact: true })).toBeVisible();
    expect((await page.request.get('/api/copilot/state')).status()).toBe(401);
    await page.getByRole('button', { name: 'Start shopping', exact: true }).click();
    await page.getByRole('button', { name: 'Already have an account? Sign in', exact: true }).click();
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill('incorrect-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(dialog.getByRole('alert')).toContainText('Invalid email or password');
    await page.getByLabel('Password', { exact: true }).fill('m1-private-passphrase-42');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await page.goto('/cart');
    await expect(page.getByLabel('Quantity ' + productId, { exact: true })).toHaveValue('2');
    await page.goto('/wishlist');
    await expect(surface.locator('article')).toHaveCount(1);
    const isolated = await context.browser()!.newContext();
    try {
      const guest = await isolated.request.post(origin + '/api/account', { headers: { Origin: origin }, data: { action: 'guest' } });
      const other = (await guest.json()).actor;
      expect(other.userId).not.toBe(owner.userId);
      expect(other.workspaceId).toBe(owner.workspaceId);
      const privateState = await (await isolated.request.get(origin + '/api/copilot/state')).json();
      expect(privateState.basket.cart).toEqual([]);
      expect(privateState.basket.wishlist).toEqual([]);
      const snapshot = await (await isolated.request.get(origin + '/api/session')).json();
      expect(snapshot.orders).toEqual([]);
      expect(snapshot.cases).toEqual([]);
    } finally { await isolated.close(); }
    await surface.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(surface).toContainText('Your wishlist is empty.');
    await page.goto('/search?filters=' + encodeURIComponent(JSON.stringify({ query: 'nonexistent-m1-product-782931' })));
    await expect(surface).toContainText('No products meet these constraints.');
    await page.getByLabel('Catalog text', { exact: true }).fill('Sony');
    await page.getByLabel('Maximum USD', { exact: true }).fill('500');
    await page.getByRole('combobox', { name: 'Sort', exact: true }).selectOption('price_desc');
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await expect(surface).toHaveAttribute('data-ready', 'true');
    await expect(surface.locator('article').first()).toBeVisible();
    const visibleIds = await surface.locator('article').evaluateAll(elements => elements.map(element => element.getAttribute('data-product-id')));
    const filteredProducts = (await (await page.request.get('/api/copilot/products?ids=' + visibleIds.join(','))).json()).products as { id: string; price: number }[];
    const prices = visibleIds.map(id => filteredProducts.find(product => product.id === id)!.price);
    expect(prices.every(price => price <= 50000)).toBe(true);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`storefront-${width}.png`) });
  });
}
test('invalid search shows a recoverable error', async ({ page }) => {
  await page.goto('/search?filters=invalid-json');
  await expect(page.locator('.concierge-page').getByRole('alert').first()).toBeVisible();
  await expect(page.locator('.concierge-page')).toHaveAttribute('aria-busy', 'false');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('.concierge-page article').first()).toBeVisible();
  await expect(page.locator('.concierge-page')).toHaveAttribute('aria-busy', 'false');
});

test('customer routes use owned empty views and recover when a session is revoked', async ({ page }) => {
  await page.request.post('/api/account', { headers: { Origin: origin }, data: { action: 'guest' } });
  for (const [route, title] of [['groups', 'A little buying power.'], ['orders', 'Every order. Looked after.'], ['support', "Let's put it right."]]) {
    await page.goto('/' + route);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  }
  await page.goto('/cart');
  await expect(page.locator('.concierge-page')).toContainText('Your cart is empty.');
  await page.request.delete('/api/session', { headers: { Origin: origin } });
  await expect(page.getByRole('button', { name: 'Start shopping', exact: true })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: /expired/ }).first()).toBeVisible();
  expect((await page.request.get('/api/copilot/state')).status()).toBe(401);
});
