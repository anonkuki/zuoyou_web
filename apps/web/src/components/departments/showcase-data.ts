export interface DepartmentInfo {
  id?: string;
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

const techFilm = (file: string, index: number, title: string): FilmEntry => ({
  title,
  romaji: `FIELD RECORD ${String(index).padStart(2, '0')}`,
  year: 2025,
  cover: `/assets/photos/departments/tech/${file}`,
  banner: `/assets/photos/departments/tech/${file}`,
});

export const deptShowcases: DeptShowcase[] = [
  {
    slug: 'publicity', order: 1, theme: '白箱影院', themeEn: 'SHIROBAKO CINEMA', accent: '#e0342f',
    vertical: '上映中',
    tagline: '把每一次热爱，都剪成值得一看再看的上映。',
    intro: '外宣负责推文、海报、摄影与宣传策划；幻想研则围绕看番、影评和动漫鉴赏展开交流。我们既记录社团活动，也认真分享值得讨论的作品。',
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
    tagline: '把想法拍下来，也把活动稳稳地送上舞台。',
    intro: '技术部围绕视频制作、摄影和道具制作开展活动。平时会组织 Premiere Pro、After Effects 教学和道具制作周常；社庆期间负责后台调控，也参与拜年祭、社团 OP 等项目的拍摄、剪辑与制作。这里既有剪辑与道具教程，也有摄影经验交流，偶尔还会一起聚餐。',
    duties: ['视频拍摄与剪辑', '摄影与经验交流', '道具制作周常', '社庆后台调控'],
    sections: [{ zh: '取景中', en: 'FOCUSING' }, { zh: '底片夹', en: 'CONTACT SHEET' }, { zh: '参数', en: 'EXIF' }],
    films: [
      techFilm('05A52E2C6776BCF896B169F36D51D9EF.jpg', 1, '现场机位准备'),
      techFilm('0F256EDC9DEA3894BFCD66D6F699B94B.jpg', 2, '镜头参数调整'),
      techFilm('4A048043B0CFFB4FD3FF364DA94CCF50.jpg', 3, '后台素材整理'),
      techFilm('571D9F4E47905DF526478FDBAEEED237.jpg', 4, '直播后台调控'),
      techFilm('B77E7B6746F5AB925E73A1BBBC7EAA31.jpg', 5, '活动摄影机位'),
      techFilm('AFAF89DD0D2AABA19B1E214B0DAD826D.jpg', 6, '现场跟拍'),
      techFilm('37413AB610492BA9D93C231451B8FAAE.png', 7, '春日底片'),
      techFilm('FAFD2BFA46F10447A854C4996C805206.png', 8, '胶片练习'),
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
    sections: [{ zh: '成员介绍', en: 'MEMBERS' }, { zh: '节目单', en: 'SETLIST' }, { zh: '演出曲目库', en: 'PERFORMANCE LIBRARY' }],
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
    sections: [{ zh: '轻音部', en: 'LIGHT MUSIC DEPARTMENT' }, { zh: '原创曲目', en: 'ORIGINAL TRACKS' }, { zh: '排练视频', en: 'REHEARSAL ARCHIVE' }],
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
