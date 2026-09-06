import { expect, test, type Page } from '@playwright/test';

const qaRoot = 'artifacts/qa';

async function loginDemo(page: Page, role: '管理员' | '负责人' | '成员') {
  await page.goto('/login');
  const demoRole = { 管理员: '社长', 负责人: '部长', 成员: '成员' }[role];
  await page.getByRole('button', { name: demoRole, exact: true }).click();
  await page.getByRole('button', { name: '登录公会' }).click();
  await expect(page).toHaveURL(role === '成员' ? /\/portal$/ : role === '负责人' ? /\/admin\/activities$/ : /\/admin$/);
}

async function revealScrollMotion(page: Page) {
  const animated = page.locator('.chronicle-entry, .department-card, .activity-card, .work-card');
  const count = await animated.count();
  for (let index = 0; index < count; index += 1) {
    await animated.nth(index).scrollIntoViewIfNeeded();
  }
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelector('.department-grid')?.scrollTo({ left: 0, behavior: 'instant' });
  });
  await expect.poll(() => animated.evaluateAll(elements => elements.every(element => Number(getComputedStyle(element).opacity) > .99))).toBe(true);
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
    await expect(page.getByRole('img', { name: '佐佑动漫社标志' })).toBeVisible();
    await expect(page.getByRole('img', { name: '佐佑动漫社看板娘佑子' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: '佑子的公会向导' })).toBeVisible();
    const atmosphere = page.getByTestId('guild-atmosphere-canvas');
    await expect(atmosphere).toHaveAttribute('data-renderer', 'three');
    await expect(atmosphere.locator('canvas')).toBeVisible();
    await expect(atmosphere).toHaveAttribute('data-quality', size.width === 390 ? 'mobile' : 'cinematic');
    await expect(page.getByLabel('分层像素幻想公会大厅场景')).toBeVisible();
    await expect(page.locator('.guild-hud article').filter({ hasText: '成员数量' }).locator('strong')).toHaveText(/^\d+$/);
    const pageHeight = await page.locator('body').evaluate(body => body.scrollHeight);
    const portalCards = page.locator('[data-portal-art]');
    await expect(portalCards).toHaveCount(3);
    const portalRatios = await portalCards.evaluateAll(cards => cards.map(card => {
      const box = card.getBoundingClientRect();
      return box.width / box.height;
    }));
    expect(pageHeight).toBeGreaterThan(size.height);
    if (size.width === 1440) {
      expect(Math.min(...portalRatios)).toBeGreaterThanOrEqual(.75);
      await page.getByRole('button', { name: '和阿澄交谈' }).click();
      await expect(page.getByText('下午要整理衣装间，想来搭把手吗？')).toBeVisible();
      await expect(page.getByText('COS部 · 服装与角色')).toBeVisible();
      await page.getByRole('button', { name: '回到佑子向导' }).click();
      await expect(page.getByText('我是看板娘佑子。第一次来佐佑的话，就从大厅慢慢逛起吧。')).toBeVisible();
    }
    if (size.width === 390) {
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
    ['/chronicle', '公会编年史'], ['/departments', '职业大厅'], ['/activities', '冒险档案馆'], ['/works', '作品图鉴'], ['/join', '加入佐佑动漫社'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    if (path === '/departments') {
      const lastDepartmentCard = page.locator('article').filter({ has: page.locator('a[href="/departments/publicity"]') });
      await expect(lastDepartmentCard).toHaveCSS('opacity', '1');
      await page.screenshot({ path: `${qaRoot}/departments-1440x900.png`, fullPage: true });
    }
  }
  expect(consoleErrors).toEqual([]);
});

test('首页故事卡与公告进入各自的真实内容页', async ({ page }) => {
  await page.goto('/');
  const departmentCard = page.locator('.adventure-entry-card.departments');
  await departmentCard.scrollIntoViewIfNeeded();
  const departmentBox = await departmentCard.boundingBox();
  expect(departmentBox).not.toBeNull();
  await page.mouse.click(departmentBox!.x + departmentBox!.width / 2, departmentBox!.y + departmentBox!.height / 2);
  await expect(page).toHaveURL(/\/departments$/);
  await page.goto('/');
  const activityCard = page.locator('.adventure-entry-card.activities');
  await activityCard.scrollIntoViewIfNeeded();
  const activityBox = await activityCard.boundingBox();
  expect(activityBox).not.toBeNull();
  await page.mouse.click(activityBox!.x + activityBox!.width / 2, activityBox!.y + activityBox!.height / 2);
  await expect(page).toHaveURL(/\/activities$/);
  await page.goto('/');
  await page.getByRole('link', { name: /2026 秋季招新现已开启/ }).click();
  await expect(page).toHaveURL(/\/announcements\/announcement-recruitment-2026$/);
  await expect(page.getByRole('heading', { name: '2026 秋季招新现已开启' })).toBeVisible();
  await expect(page.getByText('社员申请现已开放，可同时选择多个感兴趣的部门。')).toBeVisible();
  await page.screenshot({ path: `${qaRoot}/announcement-detail-1440x900.png`, fullPage: true });
  await page.getByRole('link', { name: '返回全部公告' }).click();
  await expect(page).toHaveURL(/\/announcements$/);
  await expect(page.getByRole('heading', { name: '大厅告示板' })).toBeVisible();
  await expect(page.getByRole('link', { name: '阅读完整公告' }).first()).toBeVisible();
  await page.screenshot({ path: `${qaRoot}/announcements-1440x900.png`, fullPage: true });
});

test('部门视频通过官方播放器预览并保留清单中的完整 B站分享链接', async ({ page }) => {
  await page.goto('/departments/cos');
  const previewCards = page.locator('.cos-video-card[href^="https://www.bilibili.com/video/"]');
  await expect(previewCards).toHaveCount(5);
  const playerResponsePromise = page.waitForResponse((response) =>
    response.url() === 'https://player.bilibili.com/player.html?bvid=BV1Vr7YzLE1R&autoplay=0'
      && response.request().resourceType() === 'document',
  );
  await previewCards.first().click();
  const playerResponse = await playerResponsePromise;
  expect(playerResponse.ok()).toBe(true);
  const dialog = page.getByRole('dialog', { name: /那一天的cos，接力起来/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('iframe')).toHaveAttribute(
    'src',
    'https://player.bilibili.com/player.html?bvid=BV1Vr7YzLE1R&autoplay=0',
  );
  await expect(dialog.getByRole('link', { name: '仍要前往 B站作品页' })).toHaveAttribute(
    'href',
    'https://www.bilibili.com/video/BV1Vr7YzLE1R/?share_source=copy_web&vd_source=24ea5eb803d51b94ae2092cd7a170281',
  );
  await dialog.getByRole('button', { name: '关闭视频预览' }).click();
  await expect(dialog).toBeHidden();
});

test('外宣与幻想研只展示公众号和年度总结入口', async ({ page }) => {
  await page.goto('/departments/publicity');
  await expect(page.locator('a[href^="https://www.bilibili.com/video/"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /在微信公众号阅读/ })).toHaveCount(5);
  const annualReport = page.getByRole('link', { name: '打开佐佑动漫社 2025 年度总结网站' });
  await expect(annualReport).toHaveAttribute('href', 'https://anonkuki.github.io/Zuoyou-Anime-Club-2025-Annual-Summary/');
  const [reportPage] = await Promise.all([
    page.waitForEvent('popup'),
    annualReport.click(),
  ]);
  await reportPage.waitForLoadState('domcontentloaded');
  await expect(reportPage).toHaveTitle(/佐佑动漫社\s*2025\s*年度报告/);
  await reportPage.close();
});

test('首页主要景深层会随指针产生可辨认的差速位移', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const scene = page.getByTestId('layered-guild-scene');
  await expect(scene).toHaveAttribute('data-motion', 'parallax-ready');
  await page.getByRole('button', { name: '隐藏账号入口' }).click();
  const sceneBox = await scene.boundingBox();
  expect(sceneBox).not.toBeNull();
  const sceneY = sceneBox!.y + Math.min(sceneBox!.height * .25, 200);
  await page.mouse.move(sceneBox!.x + sceneBox!.width * .5, sceneY);
  const restingBuilding = await page.locator('.guild-building-art').evaluate(element => getComputedStyle(element).translate);
  await page.mouse.move(sceneBox!.x + sceneBox!.width * .94, sceneY);
  await expect.poll(() => page.locator('.guild-building-art').evaluate(element => getComputedStyle(element).translate)).not.toBe(restingBuilding);
  await expect.poll(() => scene.evaluate(element => Number.parseFloat(getComputedStyle(element).getPropertyValue('--scene-motion-x')) || 0)).toBeGreaterThan(.7);
  const [cloudX, buildingX, partyX] = await page.locator('.layered-guild-scene').evaluate(element => {
    const readX = (selector: string) => Number.parseFloat(getComputedStyle(element.querySelector(selector)!).translate) || 0;
    return [readX('.clouds-layer'), readX('.guild-building-art'), readX('.licensed-party')];
  });
  expect(Math.abs(buildingX)).toBeGreaterThan(Math.abs(cloudX) + 5);
  expect(Math.abs(partyX)).toBeGreaterThan(Math.abs(buildingX) + 3);
  await page.mouse.move(sceneBox!.x + sceneBox!.width * .06, sceneY);
  await expect.poll(() => scene.evaluate(element => Number.parseFloat(getComputedStyle(element).getPropertyValue('--scene-motion-x')) || 0)).toBeLessThan(-.7);
  await expect.poll(() => page.locator('.guild-building-art').evaluate(element => Number.parseFloat(getComputedStyle(element).translate) || 0)).toBeGreaterThan(8);
});

test('非首页页面使用统一精修视觉系统', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const [path, name] of [
    ['/chronicle', 'chronicle-polished-1440x900.png'],
    ['/departments', 'departments-1440x900.png'],
    ['/activities', 'activities-polished-1440x900.png'],
    ['/works', 'works-polished-1440x900.png'],
    ['/join', 'join-polished-1440x900.png'],
  ] as const) {
    await page.goto(path);
    await expect(page.locator('.page-hero')).toHaveAttribute('data-visual', 'guild-page-v2');
    await expect(page.locator('[data-ornament="constellation"]')).toBeVisible();
    await revealScrollMotion(page);
    await page.screenshot({ path: `${qaRoot}/${name}`, fullPage: true });
  }

  await page.goto('/login');
  await page.screenshot({ path: `${qaRoot}/login-polished-1440x900.png`, fullPage: true });
  await loginDemo(page, '管理员');
  await expect(page.locator('.console')).toHaveAttribute('data-workspace', 'admin');
  await expect(page.locator('.console aside')).toHaveAttribute('data-surface', 'guild-navigation');
  await expect(page.locator('.console-main > header')).toHaveAttribute('data-surface', 'console-utility');
  await page.screenshot({ path: `${qaRoot}/admin-dashboard-1440x900.png`, fullPage: true });

  await page.goto('/admin/files');
  await page.screenshot({ path: `${qaRoot}/manager-files-1440x900.png`, fullPage: true });
  await page.goto('/portal');
  await expect(page.locator('.console')).toHaveAttribute('data-workspace', 'member');
  await page.screenshot({ path: `${qaRoot}/member-dashboard-polished-1440x900.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/departments');
  await expect(page.locator('.department-grid')).toBeVisible();
  await revealScrollMotion(page);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `${qaRoot}/departments-polished-390x844.png` });
  await page.goto('/admin');
  await expect(page.locator('.console aside nav')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `${qaRoot}/admin-dashboard-polished-390x844.png` });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/activities');
  await expect(page.locator('.activity-grid')).toBeVisible();
  await revealScrollMotion(page);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `${qaRoot}/activities-polished-768x1024.png` });
  await page.goto('/admin/files');
  await expect(page.locator('.console aside nav')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `${qaRoot}/manager-files-polished-768x1024.png` });
  expect(consoleErrors).toEqual([]);
});

test('招新申请到激活登录形成完整闭环', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const suffix = Date.now().toString().slice(-8);
  const displayName = `验收同学${suffix}`;
  const username = `qa.${suffix}`;
  await page.goto('/join');
  await page.getByLabel('称呼').fill(displayName);
  await page.getByLabel('学院与年级').fill('数字媒体学院 2026级');
  await page.getByLabel('联系邮箱').fill(`qa.${suffix}@example.test`);
  await page.getByLabel('自我介绍与加入理由').fill('希望参与佐佑动漫社真实活动协作与作品创作。');
  await page.getByRole('button', { name: '选择意向部门' }).click();
  await page.getByLabel('技术部').check();
  await page.getByLabel('原创部').check();
  await expect(page.getByText('已选择 2 个部门')).toBeVisible();
  await page.getByRole('button', { name: '提交社员申请' }).click();
  await expect(page.getByText('申请已经提交，请等待社团管理员审核。')).toBeVisible();
  const statusUrl = page.url();

  await loginDemo(page, '管理员');
  await expect(page.getByRole('heading', { name: '公会数据总览' })).toBeVisible();
  await page.screenshot({ path: `${qaRoot}/admin-dashboard-1440x900.png`, fullPage: true });
  await page.goto('/admin/recruitment');
  const applicationsPanel = page.locator('.parchment-panel').filter({ has: page.getByRole('heading', { name: '社员申请', exact: true }) });
  const application = applicationsPanel.locator('.manage-list > article').filter({ hasText: displayName });
  await expect(application).toHaveCount(1);
  await expect(application.getByText('技术部', { exact: true })).toBeVisible();
  await expect(application.getByText('原创部', { exact: true })).toBeVisible();
  await application.getByRole('button', { name: '通过并复制激活码' }).click();
  await expect(application.getByText('已通过')).toBeVisible();

  await page.goto(statusUrl);
  await expect(page.getByText('申请已通过')).toBeVisible();
  await page.getByRole('link', { name: '激活社员账号' }).click();
  await page.getByLabel('新用户名').fill(username);
  await page.getByLabel('新密码').fill('GuildQa!2026');
  await page.getByRole('button', { name: '建立成员档案' }).click();
  await expect(page.getByRole('heading', { name: '成员身份验证' })).toBeVisible();
  await page.getByLabel('用户名', { exact: true }).fill(username);
  await page.getByLabel('密码', { exact: true }).fill('GuildQa!2026');
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
  await page.getByRole('button', { name: '上传作品文件' }).click();
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
