export interface DepartmentVideo {
  bvid: string;
  title: string;
  href: string;
  cover: string;
  publishedAt: string;
  duration: string;
  views: number;
  note: string;
}

export interface WechatArticle {
  title: string;
  href: string;
  cover: string;
  publishedAt: string;
}

export interface AnnualReport {
  title: string;
  href: string;
  description: string;
}

export interface DepartmentMedia {
  videos?: DepartmentVideo[];
  wechatArticles?: WechatArticle[];
  annualReport?: AnnualReport;
}

type VideoSeed = readonly [
  bvid: string,
  title: string,
  cover: string,
  publishedAt: string,
  duration: string,
  views: number,
];

const video = (entry: VideoSeed, note: string): DepartmentVideo => ({
  bvid: entry[0],
  title: entry[1],
  cover: entry[2].replace(/^http:/, 'https:'),
  publishedAt: entry[3],
  duration: entry[4],
  views: entry[5],
  note,
  href: `https://www.bilibili.com/video/${entry[0]}`,
});

const videos = (entries: VideoSeed[], note: string) => entries.map(entry => video(entry, note));

/**
 * 2026-08-21 审核快照：BVID 取自用户提供的《视频列表.txt》，标题、封面、
 * 日期、时长与播放量通过 Bilibili view API 复核。跳转地址保留清单提供的
 * www.bilibili.com/video/BVID 形式；外宣&幻想研不展示 B站内容。
 */
export const departmentMediaBySlug: Record<string, DepartmentMedia> = {
  cos: {
    videos: videos([
      ['BV1Vr7YzLE1R', '那一天的cos，接力起来！【佐佑动漫社26周年社庆单品】', 'https://i0.hdslb.com/bfs/archive/8fd72c760acbfd2952ac000809847c21d23b4be2.jpg', '2025-06-04', '11:19', 1215],
      ['BV14MjozwE8G', '《东方韭菜盒子 ~ Touhou CaiCaiBox》传遍qq群的东方舞台剧？【佐佑动漫社26周年社庆单品】', 'https://i1.hdslb.com/bfs/archive/b8f06fafdd8ef7e9f0897a4b27cc2dfc43750b79.jpg', '2025-05-27', '21:16', 27168],
      ['BV1XkFoe6Esm', '【佐佑动漫社2025拜年祭】COS部：《还 有 谁 要 讲 故 事》', 'https://i0.hdslb.com/bfs/archive/73a213eb52e157dfa21e75e204567f1df86f3aab.jpg', '2025-02-01', '0:33', 201],
      ['BV1yE4m1R7kw', '【FGO舞台剧】幻想咕哒咕哒王道界域 What Can I Say', 'https://i1.hdslb.com/bfs/archive/1f9a3782fa9aff84ca57e1c91ca73c7fcac72c77.jpg', '2024-07-28', '19:21', 5659],
      ['BV11H4y1F7Q9', '【25周年社庆】北京交通大学佐佑动漫社COS接力大赏-辰龙篇', 'https://i1.hdslb.com/bfs/archive/254e11c335fc2d6d8aff5beb1101890c3e8993b3.jpg', '2024-07-16', '6:56', 1275],
    ], '从妆造、服装到舞台呈现，看看角色如何走进现实。'),
  },
  tech: {
    videos: videos([
      ['BV1t9ZaBUELx', '我们在大量的抽象中发现了少量的技术【佐佑2026拜年纪单品】', 'https://i0.hdslb.com/bfs/archive/deb0184a2ebb532b465c1f538152f52c7e9037a9.jpg', '2026-02-19', '8:16', 251],
      ['BV1AC98YeE86', '【佐佑动漫社2025拜年祭】技术部：《Project: 11*(45+1)*4》', 'https://i2.hdslb.com/bfs/archive/33d0534aae04d613ce110a25c81d8c83f9834f53.jpg', '2025-03-02', '7:15', 639],
    ], '技术部的拍摄、剪辑、合成与创意实验，都藏在成片细节里。'),
  },
  music: {
    videos: videos([
      ['BV1XhVn6UED5', '【星尘原创/毕业季应援】Sayuu, See You (feat.星尘)', 'https://i0.hdslb.com/bfs/archive/2fdce6223ea6f4066d94f4f45c5655dfdb5d6f1f.jpg', '2026-05-31', '4:01', 969],
      ['BV1ZgGJ6nEri', '【东方秘封同人曲】梦现27号 ～Neo Dream-Express feat.夢ノ結唱 POPY', 'https://i0.hdslb.com/bfs/archive/ba442b7a0ab3d2a1d7922c519161d5d54ac745fa.jpg', '2026-05-24', '3:59', 932],
      ['BV1K3ZTBGEmc', '【洛天依原创】佐梦星澜【佐佑2026拜年纪单品】', 'https://i0.hdslb.com/bfs/archive/22002440deb1fa7bb70995e5aa80447d514d9055.jpg', '2026-02-21', '5:01', 4227],
      ['BV11zFZeaE6n', '【佐佑动漫社2025拜年祭】轻音部：《孤星告白》', 'https://i1.hdslb.com/bfs/archive/e575ca6d1a66a68c1088222ae8001416fdf672aa.jpg', '2025-02-01', '3:31', 658],
      ['BV1EZA5e3Emv', '【佐佑动漫社2025拜年祭】轻音部：《花上亡灵儿》', 'https://i2.hdslb.com/bfs/archive/490563aebb68007786e60d40499629a4f25a3764.jpg', '2025-02-16', '4:05', 341],
    ], '从编曲、排练到正式演出，一起听见轻音部的声音。'),
  },
  original: {
    videos: videos([
      ['BV1ADfuBjEEt', '马尾与发圈【佐佑2026拜年纪单品】', 'https://i0.hdslb.com/bfs/archive/dfe2810bbe86c8948a6e9f4d5f89590d9630ab38.jpg', '2026-02-20', '3:07', 279],
      ['BV1KVG3z4EXM', '强风大背头（手书）【佐佑动漫社26届社庆单品】', 'https://i2.hdslb.com/bfs/archive/c535d2419523a3352c84d48a0016bf5dfcd1d99c.jpg', '2025-07-10', '2:17', 894],
      ['BV18YcFe5Eec', '【佐佑动漫社2025拜年祭】原创部：《さようなら 花泥棒さん》', 'https://i1.hdslb.com/bfs/archive/9b850ee1a6a4d9dcb4c92af043b80668526f0239.jpg', '2025-02-01', '3:19', 236],
      ['BV1JU411S73i', '【25周年社庆】手书《い~やい~やい~や》', 'https://i0.hdslb.com/bfs/archive/dd2989b0d33e908b53099c75c9f544f41da4c132.jpg', '2024-07-20', '3:19', 692],
      ['BV1py421i7GC', '【佐佑动漫社】原创部《萨卡班佑佑佑佑子》', 'https://i0.hdslb.com/bfs/archive/39562927b4850709c60e1b0f68ba08217ca2ed18.jpg', '2024-03-02', '1:30', 487],
    ], '线稿、分镜、设计与逐帧创作，在这里汇成完整作品。'),
  },
  dance: {
    videos: videos([
      ['BV1NA8G6REDQ', '【wota艺/爬台】横跨千年，只为与你相遇 -《Reply》祈霁光棒队爬台', 'https://i0.hdslb.com/bfs/archive/111ca8e04680191acd3205a983a7f0bc47a15421.jpg', '2026-08-18', '8:41', 158],
      ['BV1Xmui6EEjE', '横渡大海的下一道光芒', 'https://i1.hdslb.com/bfs/archive/842724705d64c92ef3d4e1edecae4545fa46c751.jpg', '2026-08-11', '13:26', 357],
      ['BV1YxuA6sEKU', '园田海未的女主角育成计划', 'https://i0.hdslb.com/bfs/archive/d6a6dfc000f606f48e5a5413d014a5a8c9f5eca2.jpg', '2026-08-04', '3:42', 205],
      ['BV1UHZSBeEsX', 'Love potion【佐佑2026拜年纪单品】', 'https://i0.hdslb.com/bfs/archive/34a9722b3678d18fa267ca06673139cedd6c82a8.jpg', '2026-02-18', '3:29', 737],
      ['BV1nyuvzkEMa', '寄明月【佐佑动漫社26届社庆单品】', 'https://i0.hdslb.com/bfs/archive/7ea77c3f684852311ac5721e89c18c30535899fe.jpg', '2025-07-14', '2:29', 991],
      ['BV1dvFoeLEhH', '【佐佑动漫社2025拜年祭】舞装部：《wota艺：怪物&空奏列车》', 'https://i2.hdslb.com/bfs/archive/e0731fc78f34d444d8f9b833e5522f06dcd4c2d0.jpg', '2025-02-01', '6:19', 404],
    ], '从排练节拍、队形配合到舞台感染力，完整记录每一次登台。'),
  },
  publicity: {
    annualReport: {
      title: '佐佑动漫社 2025 年度总结',
      href: 'https://anonkuki.github.io/Zuoyou-Anime-Club-2025-Annual-Summary/',
      description: '进入我们制作的年度总结网站，回看社团成员、部门作品与全年活动。',
    },
    wechatArticles: [
      { title: '《正相反的你与我》——一部高质量纯爱作品——by玉子米糕Marscarpone', publishedAt: '2026-03-12', cover: 'https://mmbiz.qpic.cn/sz_mmbiz_jpg/PCVXNIwhA26yzNVeU4qKrp2w6dZicjscVqgGfZA4HISz17XpPiarGJiawuOSQTBfjfhFehiaWdknR8UrugLGwMCibLEHsvESsG75icPsnDICI7mib4/0?wx_fmt=jpeg', href: 'https://mp.weixin.qq.com/s/Of4MI-SvXnBQoLY4EW2oyg' },
      { title: '这个时代并不需要中原岬，需要少看SNS多组乐队——By sasasino', publishedAt: '2026-03-07', cover: 'https://mmbiz.qpic.cn/sz_mmbiz_jpg/PCVXNIwhA25PiaaW0h8vwkkZibmcPrd7A9lpA0CcL3B0YZeBLIzgLVEsjSMniapxE80T1FkjosN3UYw99EBdYTnUmVmmR0iaia9XjRedvf3PTRBk/0?wx_fmt=jpeg', href: 'https://mp.weixin.qq.com/s/S0-FgJ9kIJvsB97VFLFHKg' },
      { title: '电锯人 蕾塞篇 影评——这部剧场版你能打几分？', publishedAt: '2025-12-16', cover: 'https://mmbiz.qpic.cn/mmbiz_jpg/ia8mcZRmuguwkXsXdvh3d6icv2VVVg3f2jianE1YlW7jpHibHJT2ERGH0oTkKXiaGsz24tSU7pS1jDZ97qSHqMZ5Dpw/0?wx_fmt=jpeg', href: 'https://mp.weixin.qq.com/s/D2YyNO8wd1Y-igN2eAV--g' },
      { title: '佐佑幻想研十一月动漫电影影评合辑', publishedAt: '2025-12-05', cover: 'https://mmbiz.qpic.cn/mmbiz_jpg/ia8mcZRmuguxd3n47ZNa6rXHcYeGsl9fd9ZHwRUBtjKOekP78BURw1gWTwaVt4bdDSUuL2IBxjAPBLHCFGiaXnvg/0?wx_fmt=jpeg', href: 'https://mp.weixin.qq.com/s/40Of7EsTTt7jVfbTaco7pw' },
      { title: '写给平凡的与不幸的创作者——《世界计划：无法歌唱的初音未来》观后感和影评', publishedAt: '2025-11-01', cover: 'https://mmbiz.qpic.cn/mmbiz_jpg/ia8mcZRmuguykhrfLT0ZMzmEfcdphOXv0zIDPvDDNDKXtHoNzJNgyQDZx5rjKjQiavuiaXFRL8WHZVkYUL3sIRcyQ/0?wx_fmt=jpeg', href: 'https://mp.weixin.qq.com/s/slEZZgjRLXICgG5mKQ3MXA' },
    ],
  },
};

export const officialSocialLinks = {
  bilibili: 'https://space.bilibili.com/10778739',
  wechat: departmentMediaBySlug.publicity.wechatArticles![0].href,
  annualReport: departmentMediaBySlug.publicity.annualReport!.href,
  qqChannelCode: 'pd17345257',
} as const;
