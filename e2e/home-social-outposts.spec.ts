import { expect, test } from '@playwright/test';

test('homepage publicity outposts preview videos and open reviewed Bilibili and WeChat destinations', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const outposts = page.getByRole('region', { name: '社团宣传阵地' });
  await outposts.scrollIntoViewIfNeeded();
  await expect(outposts).toBeVisible();
  await expect(outposts.getByRole('heading', { name: 'B站 · 动态影像阵地' })).toBeVisible();
  await expect(outposts.getByRole('heading', { name: '微信公众号 · 深度阅读阵地' })).toBeVisible();
  await expect(outposts.getByRole('button', { name: /预览视频/ })).toHaveCount(2);
  await expect(outposts.getByRole('link', { name: /在微信公众号阅读/ })).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/qa/home-social-outposts-1440x900.png', fullPage: false });

  const previewButton = outposts.getByRole('button', { name: /预览视频：.*横跨千年/ });
  const playerResponsePromise = page.waitForResponse((response) =>
    response.url() === 'https://player.bilibili.com/player.html?bvid=BV1NA8G6REDQ&autoplay=0'
      && response.request().resourceType() === 'document',
  );
  await previewButton.click();
  const playerResponse = await playerResponsePromise;
  expect(playerResponse.ok()).toBe(true);
  const dialog = page.getByRole('dialog', { name: /正在预览：.*横跨千年/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.home-video-modal-panel')).toBeInViewport();
  await expect(dialog.locator('iframe')).toHaveAttribute(
    'src',
    'https://player.bilibili.com/player.html?bvid=BV1NA8G6REDQ&autoplay=0',
  );
  await page.screenshot({ path: 'artifacts/qa/home-social-video-preview-1440x900.png', fullPage: false });
  await dialog.getByRole('button', { name: '关闭视频预览' }).click();
  await expect(dialog).toBeHidden();

  const bilibiliLink = outposts.getByRole('link', { name: /在哔哩哔哩打开：.*横跨千年/ });
  const [bilibiliPage] = await Promise.all([
    page.waitForEvent('popup'),
    bilibiliLink.click(),
  ]);
  await expect(bilibiliPage).toHaveURL(/www\.bilibili\.com\/video\/BV1NA8G6REDQ/);
  await bilibiliPage.close();

  const wechatLink = outposts.getByRole('link', { name: /正相反的你与我.*在微信公众号阅读/ });
  const [wechatPage] = await Promise.all([
    page.waitForEvent('popup'),
    wechatLink.click(),
  ]);
  await expect(wechatPage).toHaveURL(/mp\.weixin\.qq\.com\/s\/Of4MI-SvXnBQoLY4EW2oyg/);
  await wechatPage.close();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const mobileOutposts = page.getByRole('region', { name: '社团宣传阵地' });
  await mobileOutposts.scrollIntoViewIfNeeded();
  await expect(mobileOutposts.getByRole('heading', { name: 'B站 · 动态影像阵地' })).toBeVisible();
  await expect(mobileOutposts.getByRole('heading', { name: '微信公众号 · 深度阅读阵地' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/qa/home-social-outposts-mobile-390x844.png', fullPage: false });
});
