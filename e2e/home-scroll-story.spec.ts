import { expect, test } from '@playwright/test';

test('homepage scroll story reveals every chapter and keeps its routes real', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '创作型社团' })).toBeVisible();
  await page.screenshot({ path: 'artifacts/qa/home-scroll-hero-1440x900.png', fullPage: false });

  const story = page.locator('[data-scroll-story="three-chapter"]');
  await expect(story).toBeVisible();
  await story.evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + window.innerHeight * 1.35, behavior: 'instant' });
  });
  const chapterTwoHeading = page.getByRole('heading', { name: '创作，不设边界。' });
  await expect(chapterTwoHeading).toBeVisible();
  await expect(chapterTwoHeading).toBeInViewport();
  await expect.poll(() => page.locator('.story-create').evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThan(.75);
  await page.screenshot({ path: 'artifacts/qa/home-scroll-story-1440x900.png', fullPage: false });

  await page.getByRole('link', { name: '进入六个部门' }).click();
  await expect(page).toHaveURL(/\/departments$/);
  await page.goBack();
  await expect(story).toBeVisible();

  await story.evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + 30, behavior: 'instant' });
  });
  await page.getByRole('link', { name: '翻阅社团历史' }).click();
  await expect(page).toHaveURL(/\/history$/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('[data-scroll-story="three-chapter"]').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: /从 Virus 漫画社.*到佐佑动漫社/ })).toBeVisible();
  await page.screenshot({ path: 'artifacts/qa/home-scroll-story-mobile-390x844.png', fullPage: false });
});
