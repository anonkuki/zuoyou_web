import { expect, test } from '@playwright/test';

test('部门部长只编辑本部门职业大厅卡片并即时看到结果', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('用户名').fill('cos.lead');
  await page.getByLabel('密码').fill('DemoLead!2026');
  await page.getByRole('button', { name: '登录公会' }).click();
  await expect(page).toHaveURL(/\/admin\/activities$/);

  await page.goto('/departments');
  const editButtons = page.getByRole('button', { name: /编辑 .*部门卡片/ });
  await expect(editButtons).toHaveCount(1);
  await expect(page.getByRole('button', { name: '编辑 COS部部门卡片' })).toBeVisible();
  await page.getByRole('button', { name: '编辑 COS部部门卡片' }).click();

  const editor = page.getByRole('dialog', { name: '编辑 COS部部门卡片' });
  await expect(editor).toBeVisible();
  await editor.getByLabel('职业称号').fill('幻装统筹');
  await editor.getByLabel('部门简介').fill('统筹角色造型、服装道具与舞台呈现');
  await page.screenshot({ path: 'D:/Temp/department-card-editor-1440x900.png', fullPage: false });
  await editor.getByRole('button', { name: '保存部门卡片' }).click();

  await expect(editor).toBeHidden();
  const cosCard = page.locator('article').filter({ has: page.getByRole('button', { name: '编辑 COS部部门卡片' }) });
  await expect(cosCard).toContainText('幻装统筹');
  await expect(cosCard).toContainText('统筹角色造型、服装道具与舞台呈现');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '编辑 COS部部门卡片' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: '编辑 COS部部门卡片' })).toBeVisible();
  await page.screenshot({ path: 'D:/Temp/department-card-mobile-390x844.png', fullPage: false });
  await page.getByRole('button', { name: '编辑 COS部部门卡片' }).click();
  await expect(page.getByRole('dialog', { name: '编辑 COS部部门卡片' })).toBeVisible();
  await page.screenshot({ path: 'D:/Temp/department-card-editor-mobile-390x844.png', fullPage: false });
});
