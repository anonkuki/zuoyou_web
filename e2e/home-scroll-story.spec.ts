import { expect, test } from '@playwright/test';

test('homepage tells one continuous story through real downward scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '创作型社团' })).toBeVisible();

  const story = page.locator('[data-scroll-layout="continuous"]');
  const chapters = story.locator('[data-scroll-section]');
  await expect(story).toBeVisible();
  await expect(chapters).toHaveCount(3);

  const chapterGeometry = await chapters.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      name: element.getAttribute('data-scroll-section'),
      top: rect.top + window.scrollY,
      bottom: rect.bottom + window.scrollY,
      height: rect.height,
      position: getComputedStyle(element).position,
    };
  }));
  expect(chapterGeometry.map(({ name }) => name)).toEqual(['origin', 'departments', 'freedom']);
  chapterGeometry.forEach(({ height, position }) => {
    expect(height).toBeGreaterThanOrEqual(800);
    expect(position).toBe('relative');
  });
  expect(chapterGeometry[1].top).toBeGreaterThanOrEqual(chapterGeometry[0].bottom - 1);
  expect(chapterGeometry[2].top).toBeGreaterThanOrEqual(chapterGeometry[1].bottom - 1);

  const origin = page.locator('[data-scroll-section="origin"]');
  await origin.scrollIntoViewIfNeeded();
  const originHeading = page.getByRole('heading', { name: /从 Virus 漫画社.*到佐佑动漫社/ });
  await expect(originHeading).toBeInViewport();
  await page.screenshot({ path: 'artifacts/qa/home-scroll-origin-1440x900.png', fullPage: false });

  const departments = page.locator('[data-scroll-section="departments"]');
  await departments.scrollIntoViewIfNeeded();
  const departmentsHeading = page.getByRole('heading', { name: /创作.*不设边界/ });
  await expect(departmentsHeading).toBeInViewport();
  await page.screenshot({ path: 'artifacts/qa/home-scroll-story-1440x900.png', fullPage: false });

  const freedom = page.locator('[data-scroll-section="freedom"]');
  await freedom.scrollIntoViewIfNeeded();
  const freedomHeading = page.getByRole('heading', { name: /兴趣是入口.*作品让我们相遇/ });
  await expect(freedomHeading).toBeInViewport();
  await expect(freedom.locator('[aria-label="创作作品拼贴"] figure img')).toHaveCount(3);
  expect(await freedom.locator('[aria-label="创作作品拼贴"] img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/qa/home-scroll-freedom-1440x900.png', fullPage: false });

  await page.getByRole('link', { name: '进入六个部门' }).click();
  await expect(page).toHaveURL(/\/departments$/);
  await page.goBack();
  await expect(story).toBeVisible();
  await origin.scrollIntoViewIfNeeded();
  await page.getByRole('link', { name: '翻阅社团历史' }).click();
  await expect(page).toHaveURL(/\/history$/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const mobileDepartments = page.locator('[data-scroll-section="departments"]');
  await mobileDepartments.scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: /创作.*不设边界/ })).toBeInViewport();
  await page.screenshot({ path: 'artifacts/qa/home-scroll-story-mobile-390x844.png', fullPage: false });

  const mobileFreedom = page.locator('[data-scroll-section="freedom"]');
  await mobileFreedom.scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: /兴趣是入口.*作品让我们相遇/ })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/qa/home-scroll-freedom-mobile-390x844.png', fullPage: false });
});
