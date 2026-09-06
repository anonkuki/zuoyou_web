export interface DepartmentPhoto {
  src: string;
  alt: string;
  caption: string;
  source: '本部门投稿' | '社团年度记录';
}

const department = (folder: string, file: string, alt: string, caption: string): DepartmentPhoto => ({
  src: `/assets/photos/departments/${folder}/${file}`,
  alt,
  caption,
  source: '本部门投稿',
});

const activitySeries = (
  folder: string,
  prefix: string,
  count: number,
  departmentName: string,
  collectionName: string,
): DepartmentPhoto[] => Array.from({ length: count }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return department(
    folder,
    `${prefix}-${number}.webp`,
    `${departmentName}${collectionName}照片 ${index + 1}`,
    `${collectionName} · 活动记录 ${number}`,
  );
});

export const departmentPhotoLabels: Record<string, { name: string; title: string; intro: string }> = {
  cos: { name: 'COS部', title: '镜头里的角色与伙伴', intro: '妆造、角色演绎与活动合影，都收录在这组来自 COS 部的现场返图中。' },
  tech: { name: '技术部', title: '取景器后的现场记录', intro: '从影像纪实、剪辑教学到道具制作，镜头记录下技术部和道具组的活动日常。' },
  music: { name: '轻音部', title: '排练之外的相聚时刻', intro: '排练、演出与伙伴们相聚的片段，共同组成轻音部的活动记录。' },
  original: { name: '原创部', title: '一起创作的日常', intro: '从灵感交流到作品打磨，这些照片记录了原创部共同创作的过程。' },
  dance: { name: '舞装部', title: '舞台亮起的瞬间', intro: '排练、演出和谢幕合影，记录每一次从练习室走到聚光灯下的时刻。' },
  publicity: { name: '外宣&幻想研', title: '放映、记录与社团现场', intro: '幻想研一起看番与交流作品，外宣把活动现场整理成大家日后还能翻看的记录。' },
};

export const originalPortfolioPhotos = activitySeries(
  'original',
  'original-activity',
  4,
  '原创部',
  '原创作品',
);

export const departmentPhotosBySlug: Record<string, DepartmentPhoto[]> = {
  tech: [
    ...activitySeries('tech', 'tech-yearbook', 55, '技术部', '2026 年度佐佑影业纪实'),
    ...activitySeries('tech', 'tech-props', 11, '技术部', '道具组周常与雕南瓜'),
    ...activitySeries('tech', 'tech-editing', 9, '技术部', '剪辑教学周常'),
    ...activitySeries('tech', 'tech-review', 9, '技术部', '年度总结影像'),
  ],
  cos: activitySeries('cos', 'cos-activity', 7, 'COS部', '角色与活动'),
  dance: activitySeries('dance', 'dance-activity', 9, '舞装部', '排练与演出'),
  music: activitySeries('music', 'music-activity', 11, '轻音部', '排练与演出'),
  original: activitySeries('original', 'original-weekly', 7, '原创部', '周常活动'),
  publicity: [
    department('publicity-fantasy', 'publicity-01.jpg', '社团成员在图书馆活动后举旗合影', '图书馆活动结束后的合影'),
    department('publicity-fantasy', 'publicity-02.jpg', '社团成员参加大型影院观影活动', '一起走进放映厅看一部作品'),
    department('publicity-fantasy', 'publicity-03.jpg', '社团线下活动成员与社旗合影', '把每次线下相聚认真记录下来'),
    department('publicity-fantasy', 'publicity-04.jpg', '外宣与幻想研成员围桌交流', '围坐聊聊最近喜欢的作品'),
    department('publicity-fantasy', 'publicity-05.jpg', '外宣与幻想研线下交流会现场', '一次轻松的动漫鉴赏交流'),
    department('publicity-fantasy', 'publicity-06.jpg', '社团成员在影院大厅举旗合影', '观影活动开始前的集合'),
    department('publicity-fantasy', 'publicity-07.jpg', '成员通过镜面留下趣味活动合影', '活动记录也可以有一点巧思'),
    department('publicity-fantasy', 'publicity-08.jpg', '社团成员参加主题观影活动', '喜欢同一部作品的人在这里相遇'),
    department('publicity-fantasy', 'publicity-09.jpg', '社团成员在动漫主题展陈前合影', '动漫主题空间里的小聚'),
    department('publicity-fantasy', 'publicity-10.jpg', '幻想研成员在放映厅举旗合影', '幻想研的放映与鉴赏时间'),
    department('publicity-fantasy', 'publicity-11.jpg', '社团大型观影活动入口合影', '人到齐了，准备入场'),
    department('publicity-fantasy', 'publicity-12.jpg', '大型放映厅内的社团观影活动', '和许多同好一起看番的夜晚'),
    department('publicity-fantasy', 'publicity-13.jpg', '幻想研动漫作品分享活动现场', '从观看延伸到分享与讨论'),
    department('publicity-fantasy', 'publicity-14.jpg', '社团成员在图书馆线下活动合影', '外宣镜头里的社团日常'),
  ],
};
