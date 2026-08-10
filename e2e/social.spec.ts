import { expect, test, type Page } from '@playwright/test';

const qaRoot = 'artifacts/qa';

async function loginDemo(page: Page, role: '负责人' | '成员') {
  await page.goto('/login');
  await page.getByRole('button', { name: role, exact: true }).click();
  await page.getByRole('button', { name: '登录公会' }).click();
  await expect(page).toHaveURL(role === '成员' ? /\/portal$/ : /\/admin\/activities$/);
}

async function openConversation(page: Page, title: string) {
  const conversation = page.locator('.conversation-list > button').filter({ hasText: title });
  await expect(conversation).toHaveCount(1);
  await conversation.click();
  await expect(page.locator('.active-chat-header')).toContainText(title);
}

test('成员主页、成员发现与双账号聊天形成真实闭环', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginDemo(page, '成员');

  await page.goto('/portal/profile');
  await expect(page.getByRole('heading', { name: '编辑个人主页' })).toBeVisible();
  await page.getByLabel('公会头衔').fill('星灯记录员');
  await page.getByLabel('学院').fill('艺术设计学院');
  await page.getByLabel('年级').fill('2025级');
  await page.getByLabel('技能标签').fill('角色塑造, 道具整理, 活动协作');
  await page.getByLabel('兴趣标签').fill('动画, 摄影, 舞台演出');
  await page.getByRole('button', { name: '保存个人主页' }).click();
  await expect(page.getByText('个人主页已保存')).toBeVisible();
  await page.screenshot({ path: `${qaRoot}/member-profile-editor-1440x900.png`, fullPage: true });

  await page.goto('/portal/members');
  await expect(page.getByRole('heading', { name: '成员名录' })).toBeVisible();
  await page.getByLabel('搜索成员').fill('绯月');
  await expect(page.getByText('首席幻装师')).toBeVisible();
  await page.screenshot({ path: `${qaRoot}/member-directory-1440x900.png`, fullPage: true });
  await page.getByRole('link', { name: '查看 绯月幻装师 的主页' }).click();
  await expect(page.getByRole('heading', { name: '绯月幻装师' })).toBeVisible();
  await expect(page.getByText('数字媒体学院')).toBeVisible();
  await page.screenshot({ path: `${qaRoot}/member-homepage-1440x900.png`, fullPage: true });
  await page.getByRole('button', { name: '发起私聊' }).click();
  await expect(page).toHaveURL(/\/portal\/chat\?conversation=/);

  await expect(page.getByRole('heading', { name: '公会通讯', exact: true })).toBeVisible();
  await expect(page.locator('.message-stream').getByText('辛苦啦！发到内部文件后我来复核，注意不要包含个人联系方式。')).toBeVisible();
  await page.getByLabel('输入消息').fill('社务确认：尺寸表已上传至内部文件区。');
  await page.getByRole('button', { name: '发送消息' }).click();
  await expect(page.locator('.message-stream').getByText('社务确认：尺寸表已上传至内部文件区。')).toBeVisible();
  await page.screenshot({ path: `${qaRoot}/guild-chat-member-1440x900.png`, fullPage: true });

  await page.getByTitle('退出登录').click();
  await loginDemo(page, '负责人');
  await page.goto('/portal/chat');
  await openConversation(page, '白羽见习者');
  await expect(page.locator('.message-stream').getByText('社务确认：尺寸表已上传至内部文件区。')).toBeVisible();
  await page.getByLabel('输入消息').fill('收到，今晚完成复核并回传意见。');
  await page.getByRole('button', { name: '发送消息' }).click();
  await expect(page.locator('.message-stream').getByText('收到，今晚完成复核并回传意见。')).toBeVisible();

  await page.getByTitle('退出登录').click();
  await loginDemo(page, '成员');
  await page.goto('/portal/chat');
  await openConversation(page, '绯月幻装师');
  await expect(page.locator('.message-stream').getByText('收到，今晚完成复核并回传意见。')).toBeVisible();
  const ownMessage = page.locator('.chat-message.own').filter({ hasText: '社务确认：尺寸表已上传至内部文件区。' });
  await expect(ownMessage).toHaveCount(1);
  await ownMessage.getByRole('button', { name: '回复该消息' }).click();
  await expect(page.getByRole('button', { name: '取消回复' })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.message-panel.mobile-active')).toBeVisible();
  await expect(page.locator('.conversation-rail')).toBeHidden();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: `${qaRoot}/guild-chat-mobile-390x844.png`, fullPage: true });
  await page.getByRole('button', { name: '返回会话列表' }).click();
  await expect(page.locator('.conversation-rail')).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
