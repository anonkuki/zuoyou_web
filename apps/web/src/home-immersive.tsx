import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Compass,
  Crown,
  GalleryVerticalEnd,
  Heart,
  Map,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from './api';
import { ErrorPanel, LoadingPanel } from './components';

interface GuildSummary {
  memberCount: number;
  departmentCount: number;
  activityCount: number;
  workCount: number;
}

const portalCards = [
  {
    to: '/chronicle',
    index: '01',
    english: 'CHRONICLE',
    title: '读懂我们的来处',
    text: '从第一次相遇，到一次次把喜欢变成作品。每一年的佐佑，都有值得被记住的章节。',
    icon: BookOpen,
    tone: 'violet',
  },
  {
    to: '/departments',
    index: '02',
    english: 'CLASS HALL',
    title: '找到并肩的同伴',
    text: '六个真实协作部门，六种不同的专业方向。RPG 职业只是我们的浪漫称谓。',
    icon: Shield,
    tone: 'cyan',
  },
  {
    to: '/activities',
    index: '03',
    english: 'QUEST ARCHIVE',
    title: '看见热爱正在发生',
    text: '舞台、漫展、创作与日常企划，都在真实的活动档案中留下完整轨迹。',
    icon: Map,
    tone: 'amber',
  },
] as const;

const departmentNames = [
  ['COS部', '幻术师', 'cos'],
  ['技术部', '魔导工程师', 'tech'],
  ['轻音部', '吟游诗人', 'music'],
  ['原创部', '绘卷术士', 'original'],
  ['舞装部', '舞刃使', 'dance'],
  ['外宣部', '传令官', 'publicity'],
] as const;

function GuildMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`astral-mark ${compact ? 'compact' : ''}`} aria-hidden="true">
      <i className="mark-orbit" />
      <i className="mark-star">✦</i>
      <b>Z</b>
    </span>
  );
}

function AstralGuildScene() {
  return (
    <div className="astral-scene" data-testid="astral-guild-scene" aria-label="星夜像素幻想公会大厅动态场景">
      <svg className="astral-sky" viewBox="0 0 1600 920" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor="#080b24" />
            <stop offset="0.48" stopColor="#17234f" />
            <stop offset="0.78" stopColor="#5a3564" />
            <stop offset="1" stopColor="#e38a66" />
          </linearGradient>
          <radialGradient id="moonHalo">
            <stop offset="0" stopColor="#fffbe0" stopOpacity=".98" />
            <stop offset=".16" stopColor="#f6dca8" stopOpacity=".88" />
            <stop offset=".48" stopColor="#e6a9c9" stopOpacity=".23" />
            <stop offset="1" stopColor="#c18bea" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mountain" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#27375c" />
            <stop offset="1" stopColor="#10172f" />
          </linearGradient>
          <linearGradient id="roof" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#472d59" />
            <stop offset=".55" stopColor="#271c3e" />
            <stop offset="1" stopColor="#171329" />
          </linearGradient>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#3b3650" />
            <stop offset="1" stopColor="#191828" />
          </linearGradient>
          <linearGradient id="window" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#fff4b4" />
            <stop offset=".48" stopColor="#ffbd6b" />
            <stop offset="1" stopColor="#e46768" />
          </linearGradient>
          <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="13" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="1600" height="920" fill="url(#sky)" />
        <ellipse cx="1195" cy="198" rx="260" ry="260" fill="url(#moonHalo)" />
        <circle cx="1195" cy="198" r="72" fill="#fff5d5" opacity=".96" />
        <circle cx="1171" cy="179" r="13" fill="#e5d5bb" opacity=".34" />
        <circle cx="1222" cy="219" r="18" fill="#e5d5bb" opacity=".24" />

        <g className="svg-stars" fill="#fff9d9">
          <circle cx="130" cy="125" r="2" /><circle cx="236" cy="213" r="1.7" /><circle cx="363" cy="108" r="2.2" />
          <circle cx="492" cy="182" r="1.5" /><circle cx="639" cy="92" r="1.8" /><circle cx="766" cy="166" r="2.5" />
          <circle cx="899" cy="80" r="1.4" /><circle cx="1015" cy="288" r="2" /><circle cx="1341" cy="99" r="2" />
          <circle cx="1450" cy="228" r="1.7" /><path d="M310 267h18M319 258v18" stroke="#fff9d9" strokeWidth="2" />
          <path d="M883 231h22M894 220v22" stroke="#fff9d9" strokeWidth="2" />
        </g>

        <g className="svg-cloud cloud-far" fill="#a7b0d0" opacity=".13">
          <ellipse cx="250" cy="303" rx="190" ry="45" /><ellipse cx="405" cy="314" rx="130" ry="34" />
        </g>
        <g className="svg-cloud cloud-near" fill="#d6c1d5" opacity=".18">
          <ellipse cx="1180" cy="382" rx="210" ry="46" /><ellipse cx="1420" cy="370" rx="176" ry="38" />
        </g>

        <path d="M0 618L130 470l92 76 143-203 128 184 96-96 150 178 122-150 127 100 175-226 119 189 112-104 126 175v327H0z" fill="url(#mountain)" opacity=".67" />
        <path d="M0 700l170-115 128 68 136-139 163 148 152-98 137 98 160-77 190 99 155-131 129 108v259H0z" fill="#0d142a" opacity=".91" />

        <g className="guild-citadel">
          <ellipse cx="1175" cy="782" rx="420" ry="115" fill="#070a18" opacity=".7" />
          <path d="M840 770V530h90V422l43-66 43 66v108h98V390l61-105 62 105v140h105V438l45-71 46 71v332z" fill="url(#wall)" stroke="#78668f" strokeWidth="4" />
          <path d="M815 538l70-96h104l58 96zM1057 402l118-178 118 178zM1275 449l112-145 94 145z" fill="url(#roof)" stroke="#a47aad" strokeWidth="5" />
          <path d="M1112 770V568c0-45 28-86 63-86s63 41 63 86v202" fill="#11101e" stroke="#7d627f" strokeWidth="6" />
          <path d="M1132 770V579c0-29 18-58 43-58s43 29 43 58v191" fill="url(#window)" opacity=".82" filter="url(#softGlow)" />
          <g fill="url(#window)" filter="url(#softGlow)">
            <path d="M875 584v-53c0-18 11-32 25-32s25 14 25 32v53z" />
            <path d="M1327 575v-53c0-18 11-32 25-32s25 14 25 32v53z" />
            <path d="M1148 432v-46c0-18 12-31 27-31s27 13 27 31v46z" />
          </g>
          <path d="M1153 297h44v-74h-44zM1175 223v-51M1151 194h48" stroke="#d9b1c9" strokeWidth="6" />
          <path d="M795 770h720M860 795h610" stroke="#645377" strokeWidth="8" opacity=".55" />
        </g>

        <g className="scene-lanterns" fill="#ffd477" filter="url(#softGlow)">
          <circle cx="768" cy="705" r="7" /><circle cx="1510" cy="685" r="7" /><circle cx="702" cy="751" r="5" />
        </g>
        <path d="M0 760c280-59 498 15 725 71 269 67 526-25 875-18v107H0z" fill="#080b18" />
        <path d="M930 920c82-95 146-137 245-150 97 13 170 63 258 150" fill="#141528" opacity=".9" />
      </svg>
      <div className="aurora aurora-one" /><div className="aurora aurora-two" />
      <span className="firefly f1" /><span className="firefly f2" /><span className="firefly f3" /><span className="firefly f4" />
      <div className="pixel-sentinel sentinel-left"><i /><b /><span /></div>
      <div className="pixel-sentinel sentinel-right"><i /><b /><span /></div>
    </div>
  );
}

function LiveGuildStats() {
  const summary = useQuery({ queryKey: ['public', 'summary'], queryFn: () => api<GuildSummary>('/api/public/summary') });
  if (summary.isLoading) return <LoadingPanel label="正在读取公会状态" />;
  if (summary.error) return <ErrorPanel error={summary.error} />;
  const stats = [
    [summary.data!.memberCount, '位成员', 'MEMBERS', Users],
    [summary.data!.departmentCount, '个部门', 'CLASSES', Shield],
    [summary.data!.activityCount, '项活动', 'QUESTS', CalendarDays],
    [summary.data!.workCount, '件作品', 'CREATIONS', GalleryVerticalEnd],
  ] as const;
  return (
    <div className="astral-stats" aria-label="公会实时数据">
      {stats.map(([value, label, english, Icon]) => (
        <article key={english}>
          <span className="stat-icon"><Icon /></span>
          <strong>{value}</strong>
          <div><b>{label}</b><small>{english}</small></div>
        </article>
      ))}
    </div>
  );
}

export function HomePage() {
  const moveLight = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
    event.currentTarget.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
  };

  return (
    <main className="astral-home">
      <section className="astral-hero" onPointerMove={moveLight}>
        <AstralGuildScene />
        <div className="hero-vignette" />
        <div className="astral-hero-inner">
          <motion.div className="hero-copy" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .8 }}>
            <span className="worldline"><i /> ZOUYOU ANIME SOCIETY · SINCE 2013</span>
            <div className="hero-title-lockup">
              <span className="title-side">佐佑<br />动漫社</span>
              <h1>佐佑动漫社<em>Adventurer Guild</em></h1>
            </div>
            <p className="hero-lead">今夜，公会大厅依然为热爱亮着灯。</p>
            <p className="hero-sub">这里汇聚角色创作、音乐、舞蹈、技术与幻想。<br />我们用冒险公会的浪漫，认真经营一个真实社团。</p>
            <div className="astral-actions">
              <Link className="light-button" to="/departments"><span>进入公会大厅</span><ArrowRight /></Link>
              <Link className="line-button" to="/join">递交入会申请 <ArrowUpRight /></Link>
            </div>
            <div className="reality-note"><Heart /><span><b>这不是游戏，是我们一起创造的现实。</b>REAL PEOPLE · REAL CREATIONS · REAL MEMORIES</span></div>
          </motion.div>

          <motion.aside className="guild-dispatch" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35, duration: .7 }}>
            <div className="dispatch-top"><span>NO. 013</span><i>LIVE</i></div>
            <GuildMark />
            <small>TODAY'S GUILD NOTE</small>
            <h2>欢迎回到佐佑</h2>
            <p>公会成员正在各自的领域，为下一次相遇准备新的作品。</p>
            <div className="dispatch-location"><Compass /><span><b>公会大厅</b>坐标 · 中国 / 校园</span></div>
          </motion.aside>
        </div>
        <a className="discover-cue" href="#guild-overview"><ChevronDown /><span>DISCOVER<br />THE GUILD</span></a>
      </section>

      <section className="guild-overview" id="guild-overview">
        <div className="shell overview-heading">
          <div><span className="section-code">GUILD STATUS / 00</span><h2>我们的故事，<br /><em>正在发生。</em></h2></div>
          <p>动漫文化让我们相遇，真实协作让我们留下。这里的每一项数字，都来自成员、活动与作品档案。</p>
        </div>
        <div className="shell"><LiveGuildStats /></div>
      </section>

      <section className="guild-manifesto shell">
        <div className="manifesto-art" aria-hidden="true">
          <div className="art-moon"><Sparkles /></div>
          <div className="art-card card-a"><span>CREATE</span></div>
          <div className="art-card card-b"><span>CONNECT</span></div>
          <div className="art-card card-c"><span>RECORD</span></div>
          <div className="constellation"><i /><i /><i /><i /></div>
        </div>
        <div className="manifesto-copy">
          <span className="section-code">WHAT WE BELIEVE / 01</span>
          <h2>热爱不是标签，<br />而是共同完成的事。</h2>
          <p>在佐佑，有人站到聚光灯下，也有人守在镜头、电脑与策划案之后。不同的能力在这里相互支撑，最终成为一次活动、一件作品，以及多年以后仍能被翻阅的回忆。</p>
          <Link to="/chronicle">翻阅公会编年史 <ArrowRight /></Link>
        </div>
      </section>

      <section className="path-section">
        <div className="shell path-heading">
          <div><span className="section-code">CHOOSE YOUR PATH / 02</span><h2>从这里，走近佐佑。</h2></div>
          <p>不需要先成为“勇者”。<br />只要带着真实的兴趣与愿意协作的心。</p>
        </div>
        <div className="shell astral-portals">
          {portalCards.map(({ to, index, english, title, text, icon: Icon, tone }) => (
            <motion.article className={`astral-portal ${tone}`} key={to} whileHover={{ y: -9 }} transition={{ type: 'spring', stiffness: 250, damping: 20 }}>
              <div className="portal-head"><span>{index}</span><Icon /></div>
              <small>{english}</small><h3>{title}</h3><p>{text}</p>
              <Link to={to} aria-label={`前往${title}`}><span>EXPLORE</span><ArrowUpRight /></Link>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="class-ribbon">
        <div className="shell class-ribbon-head"><span className="section-code">SIX REAL DEPARTMENTS / 03</span><h2>六种职业称谓，六个真实部门。</h2></div>
        <div className="class-track">
          {departmentNames.map(([name, title, slug], index) => (
            <Link to={`/departments/${slug}`} key={slug}><span>0{index + 1}</span><div><b>{title}</b><small>{name}</small></div><ArrowUpRight /></Link>
          ))}
        </div>
      </section>

      <section className="closing-invitation">
        <div className="closing-orbit"><GuildMark compact /></div>
        <span className="section-code">THE NEXT CHAPTER IS YOURS</span>
        <h2>下一页编年史，<br />也许会有你的名字。</h2>
        <p>选择感兴趣的方向，提交一份真实的入会申请。</p>
        <Link className="light-button" to="/join"><span>加入佐佑动漫社</span><ArrowRight /></Link>
        <Crown className="closing-crown" />
      </section>
    </main>
  );
}
