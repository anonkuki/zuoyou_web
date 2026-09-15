import { expect, test } from '@playwright/test';

test('部门管理展示完整候选名单与职务撤销入口', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/login');
  await page.getByLabel('用户名').fill('admin');
  await page.getByLabel('密码').fill('DemoAdmin!2026');
  await page.getByRole('button', { name: '登录公会' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/departments');
  await expect(page.getByRole('heading', { name: '部门管理' })).toBeVisible();
  await expect(page.getByText(/候选仅包含已通过审核并加入本部门的有效账号，共 \d+ 人/).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /撤销 .* 部长/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /撤销 .* 副部长/ }).first()).toBeVisible();

  const cosDeputyCandidates = page.getByRole('combobox', { name: 'COS部新增副部长' });
  await expect(cosDeputyCandidates).toBeVisible();
  expect(await cosDeputyCandidates.locator('option').count()).toBeGreaterThan(1);
  await page.screenshot({ path: 'artifacts/qa/admin-department-roles-1440x900.png', fullPage: true });
});
