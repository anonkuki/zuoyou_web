import { expect, test, type Page } from '@playwright/test';

const qaRoot = 'artifacts/qa';

async function loginDemo(page: Page, role: '管理员' | '负责人' | '成员') {
  await page.goto('/login');
  await page.getByRole('button', { name: role, exact: true }).click();
  await page.getByRole('button', { name: '登录公会' }).click();
  await expect(page).toHaveURL(role === '成员' ? /\/portal$/ : role === '负责人' ? /\/admin\/activities$/ : /\/admin$/);
}

test('游客端所有页面可访问且三种尺寸视觉完整', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  const sizes = [
    { width: 1440, height: 900, name: 'home-1440x900.png' },
    { width: 768, height: 1024, name: 'home-768x1024.png' },
    { width: 390, height: 844, name: 'home-390x844.png' },
  ];
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '佐佑动漫社' })).toBeVisible();
    const atmosphere = page.getByTestId('guild-atmosphere-canvas');
    await expect(atmosphere).toHaveAttribute('data-renderer', 'three');
    await expect(atmosphere.locator('canvas')).toBeVisible();
    await expect(atmosphere).toHaveAttribute('data-quality', size.width === 390 ? 'mobile' : 'cinematic');
    await expect(page.getByLabel('分层像素幻想公会大厅场景')).toBeVisible();
    await expect(page.getByText('82', { exact: true })).toBeVisible();
    const pageHeight = await page.locator('body').evaluate(body => body.scrollHeight);
    const portalCards = page.locator('[data-portal-art]');
    await expect(portalCards).toHaveCount(3);
    const portalRatios = await portalCards.evaluateAll(cards => cards.map(card => {
      const box = card.getBoundingClientRect();
      return box.width / box.height;
    }));
    if (size.width === 1440) {
      expect(pageHeight).toBeLessThanOrEqual(1800);
      expect(Math.min(...portalRatios)).toBeGreaterThanOrEqual(.75);
    }
    if (size.width === 390) {
      expect(pageHeight).toBeLessThanOrEqual(2000);
      expect(Math.min(...portalRatios)).toBeGreaterThanOrEqual(1.35);
      const statLabels = page.locator('.guild-hud article > div > span');
      const statValues = page.locator('.guild-hud strong');
      const labelSizes = await statLabels.evaluateAll(labels => labels.map(label => Number.parseFloat(getComputedStyle(label).fontSize)));
      const valueSizes = await statValues.evaluateAll(values => values.map(value => Number.parseFloat(getComputedStyle(value).fontSize)));
      expect(Math.min(...labelSizes)).toBeGreaterThanOrEqual(9);
      expect(Math.min(...valueSizes)).toBeGreaterThanOrEqual(14);
      const lodgeBox = await page.locator('.guild-building-art').evaluate(element => element.getBoundingClientRect().toJSON());
      expect(lodgeBox.x).toBeGreaterThanOrEqual(-12);
      expect(lodgeBox.right).toBeLessThanOrEqual(size.width + 12);
    }
    if (size.width === 768) {
      const cardBoxes = await portalCards.evaluateAll(cards => cards.map(card => card.getBoundingClientRect().top));
      expect(cardBoxes[1] - cardBoxes[0]).toBeGreaterThan(180);
      expect(Math.abs(cardBoxes[1] - cardBoxes[2])).toBeLessThan(4);
      const footerSections = page.locator('.pixel-footer-main > section');
      await expect(footerSections).toHaveCount(3);
      const footerTops = await footerSections.evaluateAll(sections => sections.map(section => section.getBoundingClientRect().top));
      expect(Math.max(...footerTops) - Math.min(...footerTops)).toBeLessThan(4);
    }
    await page.screenshot({ path: `${qaRoot}/${size.name}`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [path, heading] of [
    ['/chronicle', '公会编年史'], ['/departments', '职业大厅'], ['/activities', '冒险档案馆'], ['/works', '作品图鉴'], ['/join', '加入公会'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    if (path === '/departments') {
      const lastDepartmentCard = page.getByRole('heading', { name: '外宣部' }).locator('..');
      await expect(lastDepartmentCard).toHaveCSS('opacity', '1');
      await page.screenshot({ path: `${qaRoot}/departments-1440x900.png`, fullPage: true });
    }
  }
  expect(consoleErrors).toEqual([]);
});

test('首页主要景深层会随指针产生可辨认的差速位移', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const scene = page.getByTestId('layered-guild-scene');
  await expect(scene).toHaveAttribute('data-motion', 'parallax-ready');
  await page.mouse.move(720, 360);
  const restingBuilding = await page.locator('.guild-building-art').evaluate(element => getComputedStyle(element).translate);
  await page.mouse.move(1380, 90);
  await expect.poll(() => page.locator('.guild-building-art').evaluate(element => getComputedStyle(element).translate)).not.toBe(restingBuilding);
  await expect.poll(() => page.locator('.guild-building-art').evaluate(element => Math.abs(Number.parseFloat(getComputedStyle(element).translate) || 0))).toBeGreaterThanOrEqual(14);
  const [cloudX, buildingX, partyX] = await page.locator('.layered-guild-scene').evaluate(element => {
    const readX = (selector: string) => Number.parseFloat(getComputedStyle(element.querySelector(selector)!).translate) || 0;
    return [readX('.clouds-layer'), readX('.guild-building-art'), readX('.licensed-party')];
  });
  expect(Math.abs(buildingX)).toBeGreaterThan(Math.abs(cloudX) + 5);
  expect(Math.abs(partyX)).toBeGreaterThan(Math.abs(buildingX) + 3);
  await page.mouse.move(170, 210);
  await expect.poll(() => page.locator('.guild-building-art').evaluate(element => Number.parseFloat(getComputedStyle(element).translate) || 0)).toBeGreaterThan(8);
});

test('招新申请到激活登录形成完整闭环', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const suffix = Date.now().toString().slice(-8);
  const displayName = `验收旅人${suffix}`;
  const username = `qa.${suffix}`;
  await page.goto('/join');
  await page.getByRole('button', { name: '继续填写资料' }).click();
  await page.getByLabel('称呼').fill(displayName);
  await page.getByLabel('学院与年级').fill('数字媒体学院 2026级');
  await page.getByLabel('联系邮箱').fill(`qa.${suffix}@example.test`);
  await page.getByLabel('自我介绍与加入理由').fill('希望参与佐佑动漫社真实活动协作与作品创作。');
  await page.getByRole('button', { name: '提交加入申请' }).click();
  await expect(page.getByText('档案已进入审核队列')).toBeVisible();
  const statusUrl = page.url();

  await loginDemo(page, '管理员');
  await expect(page.getByRole('heading', { name: '公会数据总览' })).toBeVisible();
  await page.screenshot({ path: `${qaRoot}/admin-dashboard-1440x900.png`, fullPage: true });
  await page.goto('/admin/recruitment');
  const application = page.locator('article').filter({ hasText: displayName });
  await expect(application).toHaveCount(1);
  await application.getByRole('button', { name: '通过并复制激活码' }).click();
  await expect(application.getByText('已通过')).toBeVisible();

  await page.goto(statusUrl);
  await expect(page.getByText('申请已通过')).toBeVisible();
  await page.getByRole('link', { name: '激活成员身份' }).click();
  await page.getByLabel('新用户名').fill(username);
  await page.getByLabel('新密码').fill('GuildQa!2026');
  await page.getByRole('button', { name: '建立成员档案' }).click();
  await expect(page.getByRole('heading', { name: '成员身份验证' })).toBeVisible();
  await page.getByLabel('用户名').fill(username);
  await page.getByLabel('密码').fill('GuildQa!2026');
  await page.getByRole('button', { name: '登录公会' }).click();
  await expect(page.getByRole('heading', { name: `欢迎回来，${displayName}` })).toBeVisible();
});

test('管理员公告发布后进入首页并可再次下架', async ({ page }) => {
  const title = `六部门联合成果展${Date.now().toString().slice(-8)}`;
  await loginDemo(page, '管理员');
  await page.goto('/admin/announcements');
  await page.getByRole('button', { name: '新建公告' }).click();
  await page.getByLabel('公告标题').fill(title);
  await page.getByLabel('公告分类').selectOption('ACTIVITY');
  await page.getByLabel('公告摘要').fill('端到端验收发布的虚构社团活动公告。');
  await page.getByLabel('站内链接').fill('/activities');
  await page.getByText('置顶显示 NEW 标记').click();
  await page.getByRole('button', { name: '保存公告' }).click();
  const announcement = page.locator('article').filter({ hasText: title });
  await expect(announcement).toHaveCount(1);
  await expect(announcement.getByRole('button', { name: `下架 ${title}` })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${qaRoot}/admin-announcements-1440x900.png`, fullPage: true });

  await page.goto('/');
  await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible();
  await page.goto('/admin/announcements');
  const publishedAnnouncement = page.locator('article').filter({ hasText: title });
  await publishedAnnouncement.getByRole('button', { name: `下架 ${title}` }).click();
  await expect(publishedAnnouncement.getByRole('button', { name: `发布 ${title}` })).toBeVisible();
  await page.goto('/');
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);
});

test('成员作品、负责人审核、活动与文件操作可实际执行', async ({ page }) => {
  const suffix = Date.now().toString().slice(-8);
  const workTitle = `星灯作品${suffix}`;
  const activityTitle = `协作任务${suffix}`;
  const fileName = `验收资料${suffix}.txt`;
  const archiveFileName = `档案资料${suffix}.txt`;
  await loginDemo(page, '成员');
  await page.goto('/portal/works');
  await page.getByRole('button', { name: '上传新作品' }).click();
  await page.getByLabel('作品名称').fill(workTitle);
  await page.getByLabel('作品说明').fill('端到端验收提交的真实作品文件');
  await page.getByLabel('作品文件', { exact: true }).setInputFiles({ name: fileName, mimeType: 'text/plain', buffer: Buffer.from('guild work e2e') });
  await page.getByRole('button', { name: '提交审核' }).click();
  await expect(page.getByRole('heading', { name: workTitle })).toBeVisible();

  await page.getByTitle('退出登录').click();
  await loginDemo(page, '负责人');
  await page.goto('/admin/works');
  const work = page.locator('article').filter({ hasText: workTitle });
  await expect(work).toHaveCount(1);
  await work.getByRole('button', { name: '发布' }).click();
  await expect(page.getByText('当前队列为空')).toBeVisible();

  await page.goto('/admin/activities');
  await page.getByRole('button', { name: '创建活动' }).click();
  await page.getByLabel('活动名称').fill(activityTitle);
  await page.getByLabel('活动说明').fill('端到端活动生命周期验收');
  await page.getByLabel('活动地点').fill('星门大厅验收区');
  await page.getByRole('button', { name: '保存筹备活动' }).click();
  const activity = page.locator('article').filter({ hasText: activityTitle });
  await expect(activity).toHaveCount(1);
  await activity.getByRole('button', { name: '开放报名' }).click();
  await expect(activity.getByText('报名中')).toBeVisible();

  await page.getByTitle('退出登录').click();
  await loginDemo(page, '成员');
  await page.goto('/portal/activities');
  const memberActivity = page.locator('article').filter({ hasText: activityTitle });
  await expect(memberActivity).toHaveCount(1);
  await memberActivity.getByRole('button', { name: '报名活动' }).click();
  await expect(page.getByText('活动报名成功')).toBeVisible();

  await page.getByTitle('退出登录').click();
  await loginDemo(page, '负责人');
  await page.goto('/admin/activities');
  const liveActivity = page.locator('article').filter({ hasText: activityTitle });
  await liveActivity.getByRole('button', { name: '开始并生成签到码' }).click();
  const codeLabel = liveActivity.getByText(/签到码：/);
  await expect(codeLabel).toBeVisible();
  const checkInCode = (await codeLabel.textContent())!.replace('签到码：', '').trim();

  await page.getByTitle('退出登录').click();
  await loginDemo(page, '成员');
  await page.goto('/portal/activities');
  const checkingActivity = page.locator('article').filter({ hasText: activityTitle });
  await page.getByLabel(`${activityTitle}签到码`).fill(checkInCode);
  await checkingActivity.getByRole('button', { name: '现场签到' }).click();
  await expect(page.getByText('现场签到成功')).toBeVisible();

  await page.getByTitle('退出登录').click();
  await loginDemo(page, '负责人');
  await page.goto('/admin/activities');
  const endingActivity = page.locator('article').filter({ hasText: activityTitle });
  await endingActivity.getByRole('button', { name: '结束活动' }).click();
  await expect(endingActivity.getByText('已结束')).toBeVisible();
  await page.getByLabel(`${activityTitle}成果说明`).fill('成员协作完成，成果文件与总结已归档。');
  await page.getByLabel(`${activityTitle}成果文件`).setInputFiles({ name: `活动成果${suffix}.txt`, mimeType: 'text/plain', buffer: Buffer.from('activity result e2e') });
  await endingActivity.getByRole('button', { name: '上传成果文件' }).click();
  await expect(endingActivity.getByText(/成果文件已上传/)).toBeVisible();
  await endingActivity.getByRole('button', { name: '填写成果并归档' }).click();
  await expect(endingActivity.getByText('已归档', { exact: true })).toBeVisible();

  await page.goto('/admin/files');
  await page.getByRole('button', { name: '上传文件' }).click();
  await page.getByLabel('选择文件').setInputFiles({ name: archiveFileName, mimeType: 'text/plain', buffer: Buffer.from('guild file e2e') });
  await page.getByLabel('业务分类').selectOption('PLAN');
  await page.getByRole('button', { name: '保存文件' }).click();
  const file = page.locator('article').filter({ hasText: archiveFileName });
  await expect(file).toHaveCount(1);
  await expect(file.getByText(/PLAN/)).toBeVisible();
  await file.getByRole('button', { name: '回收' }).click();
  await expect(file.getByRole('button', { name: '恢复' })).toBeVisible();
  await file.getByRole('button', { name: '恢复' }).click();
  await expect(file.getByRole('button', { name: '回收' })).toBeVisible();
  const renamedFileName = `已重命名${archiveFileName}`;
  page.once('dialog', dialog => dialog.accept(renamedFileName));
  await file.getByRole('button', { name: '重命名' }).click();
  await expect(page.getByRole('heading', { name: renamedFileName })).toBeVisible();
  await page.screenshot({ path: `${qaRoot}/manager-files-1440x900.png`, fullPage: true });
});

test('部门任务指派、成员完成、负责人确认并展示私有照片', async ({ page }) => {
  const taskTitle = `道具清单复核${Date.now().toString().slice(-8)}`;
  await loginDemo(page, '负责人');
  await page.goto('/admin/tasks');
  await page.getByRole('button', { name: '指派新任务' }).click();
  await page.getByLabel('指派成员').selectOption({ label: '白羽见习者' });
  await page.getByLabel('任务名称').fill(taskTitle);
  await page.getByLabel('任务说明').fill('核对活动道具数量和当前可用状态。');
  await page.getByRole('button', { name: '发布任务' }).click();
  await expect(page.getByRole('heading', { name: taskTitle })).toBeVisible();

  await page.getByTitle('退出登录').click();
  await loginDemo(page, '成员');
  await page.goto('/portal/tasks');
  const memberTask = page.locator('article').filter({ hasText: taskTitle });
  await memberTask.getByRole('button', { name: '标记完成' }).click();
  await expect(memberTask.getByText('等待负责人确认')).toBeVisible();
  await page.goto('/portal/files');
  await expect(page.getByRole('img', { name: '佐佑动漫社周年社庆合影.jpg' })).toBeVisible();

  await page.getByTitle('退出登录').click();
  await loginDemo(page, '负责人');
  await page.goto('/admin/tasks');
  const leadTask = page.locator('article').filter({ hasText: taskTitle });
  await leadTask.getByRole('button', { name: '确认贡献' }).click();
  await expect(leadTask.getByText('已确认')).toBeVisible();

  await page.getByTitle('退出登录').click();
  await loginDemo(page, '成员');
  await expect(page.getByRole('heading', { name: '近期贡献记录' })).toBeVisible();
  await expect(page.getByText('任务确认').first()).toBeVisible();
});
