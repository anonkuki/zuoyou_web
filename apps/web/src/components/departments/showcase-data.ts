export interface DepartmentInfo {
  slug: string;
  name: string;
  title: string;
  description: string;
  memberCount?: number;
}

export interface FilmEntry { title: string; romaji: string; year: number; cover: string; banner: string }
export interface ShowcaseSection { zh: string; en: string }

export interface DeptShowcase {
  slug: string;
  order: number;
  theme: string;
  themeEn: string;
  tagline: string;
  intro: string;
  duties: string[];
  accent: string;
  vertical: string;
  sections: [ShowcaseSection, ShowcaseSection, ShowcaseSection];
  films: FilmEntry[];
}

/** 每部门独立运动语法：easing / 时长 / 错峰 */
export interface DeptMotion {
  kind: 'steps' | 'shutter' | 'spring' | 'beat' | 'dissolve' | 'flow';
  duration: number;
  stagger: number;
  ease: [number, number, number, number];
}

export const deptMotion: Record<string, DeptMotion> = {
  publicity: { kind: 'steps', duration: .42, stagger: .07, ease: [0.7, 0, 0.3, 1] },
  tech: { kind: 'shutter', duration: .5, stagger: .06, ease: [0.2, 0.9, 0.25, 1] },
  original: { kind: 'spring', duration: .8, stagger: .09, ease: [0.22, 1, 0.36, 1] },
  dance: { kind: 'beat', duration: .82, stagger: .11, ease: [0.16, 1, 0.3, 1] },
  cos: { kind: 'dissolve', duration: 1.25, stagger: .1, ease: [0.22, 1, 0.36, 1] },
  music: { kind: 'flow', duration: 1.1, stagger: .08, ease: [0.16, 1, 0.3, 1] },
};

/** steps() 逐帧 easing（放映机逐帧跳进感） */
export const stepsEase = (frames: number) => (t: number) => (t >= 1 ? 1 : Math.floor(t * frames) / frames);

const film = (slug: string, index: number, title: string, romaji: string, year: number): FilmEntry => {
  const nn = String(index).padStart(2, '0');
  return { title, romaji, year, cover: `/assets/departments/${slug}/${nn}-cover.jpg`, banner: `/assets/departments/${slug}/${nn}-banner.jpg` };
};

export const deptShowcases: DeptShowcase[] = [
  {
    slug: 'publicity', order: 1, theme: '白箱影院', themeEn: 'SHIROBAKO CINEMA', accent: '#e0342f',
    vertical: '上映中',
    tagline: '把每一次热爱，都剪成值得一看再看的上映。',
    intro: '推文、海报、摄影、公众号与 B 站，加上幻想研的影评和动漫文化讨论——我们负责让每一次活动被看见，也让值得聊的作品被认真记录。',
    duties: ['新媒体运营', '视觉设计', '宣传策划', '影像记录'],
    sections: [{ zh: '正在上映', en: 'NOW SHOWING' }, { zh: '年度片单', en: 'FILMOGRAPHY' }, { zh: '场刊', en: 'PRESS KIT' }],
    films: [
      film('publicity', 1, 'チェンソーマン', 'Chainsaw Man', 2022),
      film('publicity', 2, 'ルックバック', 'Look Back', 2024),
      film('publicity', 3, 'すずめの戸締まり', 'Suzume no Tojimari', 2022),
      film('publicity', 4, '進撃の巨人', 'Shingeki no Kyojin', 2013),
      film('publicity', 5, '鬼滅の刃', 'Kimetsu no Yaiba', 2019),
      film('publicity', 6, '呪術廻戦', 'Jujutsu Kaisen', 2020),
      film('publicity', 7, 'SPY×FAMILY', 'SPY×FAMILY', 2022),
      film('publicity', 8, '葬送のフリーレン', 'Sousou no Frieren', 2023),
      film('publicity', 9, '君の名は。', 'Kimi no Na wa.', 2016),
      film('publicity', 10, '千と千尋の神隠し', 'Sen to Chihiro no Kamikakushi', 2001),
      film('publicity', 11, 'ONE PIECE', 'ONE PIECE', 1999),
      film('publicity', 12, 'ヴァイオレット・エヴァーガーデン', 'Violet Evergarden', 2018),
    ],
  },
  {
    slug: 'tech', order: 2, theme: '取景器', themeEn: 'VIEWFINDER', accent: '#ff9f43',
    vertical: '撮影中',
    tagline: '世界在快门落下的一瞬成为永恒。',
    intro: '摄影、直播、灯光、后期——技术部躲在取景器后面，把公会的每个高光时刻收进底片。我们不出现在照片里，但每张照片都是我们的签名。',
    duties: ['摄影摄像', '直播推流', '后期制作', '舞台技术'],
    sections: [{ zh: '取景中', en: 'FOCUSING' }, { zh: '底片夹', en: 'CONTACT SHEET' }, { zh: '参数', en: 'EXIF' }],
    films: [
      film('tech', 1, 'たまゆら', 'Tamayura', 2010),
      film('tech', 2, '多田くんは恋をしない', 'Tada-kun wa Koi wo Shinai', 2018),
      film('tech', 3, 'Just Because!', 'Just Because!', 2017),
      film('tech', 4, '聲の形', 'Koe no Katachi', 2016),
      film('tech', 5, '天気の子', 'Tenki no Ko', 2019),
      film('tech', 6, '言の葉の庭', 'Kotonoha no Niwa', 2013),
      film('tech', 7, '秒速５センチメートル', 'Byousoku 5 Centimeter', 2007),
      film('tech', 8, 'ヴァイオレット・エヴァーガーデン', 'Violet Evergarden', 2018),
    ],
  },
  {
    slug: 'original', order: 3, theme: '梦色画室', themeEn: 'ATELIER', accent: '#f7a8b8',
    vertical: '制作中',
    tagline: '空白的画布，是宇宙开始的地方。',
    intro: '插画、漫画、设定、手书——原创部的人相信，每一笔线条都是在给世界增加新的可能性。在这里，脑洞是硬通货。',
    duties: ['绘画创作', '漫画与手书', '世界观设定', '合志企划'],
    sections: [{ zh: '画室里', en: 'IN THE ATELIER' }, { zh: '作品集锦', en: 'GALLERY' }, { zh: '画具箱', en: 'TOOLBOX' }],
    films: [
      film('original', 1, 'ブルーピリオド', 'Blue Period', 2021),
      film('original', 2, '月刊少女野崎くん', 'Gekkan Shoujo Nozaki-kun', 2014),
      film('original', 3, 'SHIROBAKO', 'SHIROBAKO', 2014),
      film('original', 4, 'ハチミツとクローバー', 'Hachimitsu to Clover', 2005),
      film('original', 5, 'さくら荘のペットな彼女', 'Sakurasou no Pet na Kanojo', 2012),
      film('original', 6, '映像研には手を出すな！', 'Eizouken ni wa Te wo Dasu na!', 2020),
    ],
  },
  {
    slug: 'dance', order: 4, theme: '星轨舞台', themeEn: 'STARDUST STAGE', accent: '#ff4d8d',
    vertical: '舞台上',
    tagline: '地板记得每一次练习，舞台记得每一次绽放。',
    intro: '宅舞、WOTA 艺、舞台编排——舞装部是公会的引擎室。音乐一响，所有人都会跟着我们动起来。',
    duties: ['宅舞编排', 'WOTA 艺', '舞台演出', '快闪企划'],
    sections: [{ zh: '演出中', en: 'ON STAGE' }, { zh: '节目单', en: 'SETLIST' }, { zh: '后台', en: 'BACKSTAGE' }],
    films: [
      film('dance', 1, 'ボールルームへようこそ', 'Ballroom e Youkoso', 2017),
      film('dance', 2, 'ラブライブ! School idol project', 'Love Live! School idol project', 2013),
      film('dance', 3, 'ゾンビランドサガ', 'Zombie Land Saga', 2018),
      film('dance', 4, 'ユーリ!!! on ICE', 'Yuuri!!! on ICE', 2016),
      film('dance', 5, 'アイドルマスター', 'THE IDOLM@STER', 2011),
      film('dance', 6, '響け！ユーフォニアム', 'Hibike! Euphonium', 2015),
    ],
  },
  {
    slug: 'cos', order: 5, theme: '镜中变身', themeEn: 'HENSHIN MIRROR', accent: '#d6336c',
    vertical: '変身中',
    tagline: '每一次穿上，都是一次成为。',
    intro: '服装、妆造、道具、演绎——COS 部相信角色不止存在于屏幕里。量体、裁剪、上妆、定妆，我们在镜子前完成一次次小小的蜕变。',
    duties: ['服装制作', '妆造设计', '角色演绎', '漫展协作'],
    sections: [{ zh: '镜前', en: 'BEFORE THE MIRROR' }, { zh: '变身记录', en: 'TRANSFORMATIONS' }, { zh: '衣装间', en: 'WARDROBE' }],
    films: [
      film('cos', 1, 'その着せ替え人形は恋をする', 'Sono Bisque Doll wa Koi wo Suru', 2022),
      film('cos', 2, '2.5次元の誘惑', '2.5 Jigen no Ririsa', 2024),
      film('cos', 3, '私がモテてどうすんだ', 'Watashi ga Motete Dousunda', 2016),
      film('cos', 4, 'ヲタクに恋は難しい', 'Wotaku ni Koi wa Muzukashii', 2018),
      film('cos', 5, '斉木楠雄のΨ難', 'Saiki Kusuo no Ψ-nan', 2016),
      film('cos', 6, 'フルーツバスケット 1st Season', 'Fruits Basket: 1st Season', 2019),
    ],
  },
  {
    slug: 'music', order: 6, theme: '滚动歌词', themeEn: 'LYRIC ROOM', accent: '#f5c96b',
    vertical: '演奏中',
    tagline: '副歌要一起唱，才叫做轻音部。',
    intro: '乐队排练 / 舞台演出 / 声乐交流 / 原创编曲',
    duties: ['乐队排练', '舞台演出', '声乐交流', '原创编曲'],
    sections: [{ zh: '正在播放', en: 'NOW PLAYING' }, { zh: '歌单', en: 'TRACKLIST' }, { zh: '排练室', en: 'REHEARSAL' }],
    films: [
      film('music', 1, 'けいおん!', 'K-ON!', 2009),
      film('music', 2, 'ぼっち・ざ・ろっく！', 'Bocchi the Rock!', 2022),
      film('music', 3, 'BanG Dream!（バンドリ！）', 'BanG Dream!', 2017),
      film('music', 4, 'ギヴン', 'Given', 2019),
      film('music', 5, '四月は君の嘘', 'Shigatsu wa Kimi no Uso', 2014),
      film('music', 6, 'キャロル＆チューズデイ', 'Carole & Tuesday', 2019),
    ],
  },
];

export const showcaseBySlug: Record<string, DeptShowcase> = Object.fromEntries(deptShowcases.map(show => [show.slug, show]));

export const musicLyrics = [
  '前奏响起的瞬间 世界就安静下来',
  '排练室的灯 被我们一盏一盏唱亮',
  '跑调也没关系 青春本来就没有标准音',
  '琴弦上住着 那些没说完的话',
  '副歌要一起唱 才叫做轻音部',
  '把每一次舞台 都当作最后一场来演',
  '汗水落在鼓面上 也会开出花来',
  '从放课后的教室 到音乐节的灯光',
  '当最后一个音符落下',
  '掌声 就是我们的银河',
];
