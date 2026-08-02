import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Compass,
  Crown,
  Flame,
  GalleryVerticalEnd,
  Hammer,
  Map,
  Music,
  Palette,
  ScrollText,
  Shield,
  Sparkles,
  Users,
  WandSparkles,
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

const departments = [
  ['COS部', '幻术师', 'cos', WandSparkles, '角色、妆造与舞台呈现'],
  ['技术部', '魔导工程师', 'tech', Hammer, '影像、后期与技术支持'],
  ['轻音部', '吟游诗人', 'music', Music, '乐队、演出与音乐交流'],
  ['原创部', '绘卷术士', 'original', Palette, '绘画、文字与原创表达'],
  ['舞装部', '舞刃使', 'dance', Sparkles, '舞蹈、WOTA与舞台编排'],
  ['外宣部', '传令官', 'publicity', Compass, '宣传、新媒体与内容策划'],
] as const;

function TavernScene() {
  return (
    <div className="tavern-scene" data-testid="tavern-guild-scene" aria-label="高精度像素酒馆公会大厅动态场景">
      <svg viewBox="0 0 1600 920" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="tavernWall" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#352d2b"/><stop offset="1" stopColor="#171414"/></linearGradient>
          <linearGradient id="timber" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6e4227"/><stop offset=".45" stopColor="#3c2418"/><stop offset="1" stopColor="#1d1511"/></linearGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#4a2d1e"/><stop offset="1" stopColor="#170f0c"/></linearGradient>
          <radialGradient id="hearth"><stop stopColor="#fff2a6"/><stop offset=".22" stopColor="#ffb23e"/><stop offset=".55" stopColor="#e45328"/><stop offset="1" stopColor="#7b201b" stopOpacity="0"/></radialGradient>
          <radialGradient id="candleGlow"><stop stopColor="#fff1b2" stopOpacity=".72"/><stop offset="1" stopColor="#ef7c32" stopOpacity="0"/></radialGradient>
          <pattern id="stone" width="92" height="50" patternUnits="userSpaceOnUse"><rect width="92" height="50" fill="#2d2826"/><path d="M0 1h92M0 49h92M46 0v25M0 25h92M20 25v25M72 25v25" stroke="#171514" strokeWidth="3"/><path d="M3 5h39M49 5h38M4 30h13M24 30h44M75 30h13" stroke="#4c413b" strokeWidth="2" opacity=".5"/></pattern>
          <filter id="fireGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="17" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="sceneSoft"><feGaussianBlur stdDeviation=".35"/></filter>
        </defs>

        <rect width="1600" height="920" fill="#120f10"/>
        <rect x="0" y="70" width="1600" height="650" fill="url(#stone)"/>
        <rect x="0" y="0" width="1600" height="170" fill="#171113"/>
        <path d="M0 0h1600v82H0zM0 70l800 185 800-185v67L800 322 0 137z" fill="url(#timber)" stroke="#160e0b" strokeWidth="12"/>
        <path d="M140 0l535 282M1460 0L925 282M370 0l353 266M1230 0L877 266" stroke="#794529" strokeWidth="38" opacity=".8"/>

        <g className="arched-windows">
          <path d="M116 490V260c0-72 55-130 122-130s122 58 122 130v230z" fill="#161827" stroke="#744b32" strokeWidth="18"/>
          <path d="M144 456V267c0-53 42-98 94-98s94 45 94 98v189z" fill="#26384a" stroke="#201a1a" strokeWidth="8"/>
          <path d="M238 170v286M145 326h187" stroke="#7d573a" strokeWidth="12"/>
          <path d="M1240 490V260c0-72 55-130 122-130s122 58 122 130v230z" fill="#161827" stroke="#744b32" strokeWidth="18"/>
          <path d="M1268 456V267c0-53 42-98 94-98s94 45 94 98v189z" fill="#243747" stroke="#201a1a" strokeWidth="8"/>
          <path d="M1362 170v286M1269 326h187" stroke="#7d573a" strokeWidth="12"/>
        </g>

        <g className="back-door">
          <path d="M595 594V325c0-117 91-211 205-211s205 94 205 211v269z" fill="#171313" stroke="#6d4229" strokeWidth="24"/>
          <path d="M640 594V337c0-87 71-158 160-158s160 71 160 158v257z" fill="url(#timber)" stroke="#241713" strokeWidth="9"/>
          <path d="M800 181v413M650 370h300" stroke="#2a1913" strokeWidth="11"/>
          <circle cx="916" cy="443" r="12" fill="#d5a553" stroke="#3b2417" strokeWidth="5"/>
          <path d="M760 259h80l20 46-60 42-60-42z" fill="#26191a" stroke="#c18a49" strokeWidth="5"/>
          <text x="800" y="318" textAnchor="middle" fill="#f1ca73" fontFamily="Georgia" fontSize="34" fontWeight="700">Z · G</text>
        </g>

        <g className="quest-board">
          <path d="M392 253h215v284H392z" fill="#4e2e1c" stroke="#21130e" strokeWidth="13"/>
          <path d="M408 269h183v252H408z" fill="#8a5a32" stroke="#bd8550" strokeWidth="4"/>
          <g fill="#ddc69b" stroke="#5d3c25" strokeWidth="3">
            <path d="M426 288h72v88h-72z" transform="rotate(-3 462 332)"/><path d="M510 300h62v74h-62z" transform="rotate(4 541 337)"/>
            <path d="M430 391h63v105h-63z" transform="rotate(2 461 443)"/><path d="M507 392h67v101h-67z" transform="rotate(-4 540 442)"/>
          </g>
          <g fill="#7d2e23"><circle cx="460" cy="304" r="7"/><circle cx="541" cy="316" r="7"/><circle cx="462" cy="409" r="7"/><circle cx="540" cy="408" r="7"/></g>
          <path d="M453 326h25M449 342h34M528 337h28M447 435h31M525 436h34M524 454h29" stroke="#6e5435" strokeWidth="4"/>
        </g>

        <g className="hearth-group">
          <path d="M1045 272h282v314h-282z" fill="#211918" stroke="#5e4232" strokeWidth="17"/>
          <path d="M1082 586V425c0-70 47-125 104-125s104 55 104 125v161z" fill="#0f0c0b" stroke="#7b5740" strokeWidth="11"/>
          <ellipse cx="1186" cy="516" rx="142" ry="130" fill="url(#hearth)" opacity=".34" filter="url(#fireGlow)"/>
          <g className="svg-fire" filter="url(#fireGlow)"><path d="M1133 556c-25-57 36-80 25-137 52 31 41 72 54 93 15-24 22-44 17-73 49 52 31 99 2 117z" fill="#e65a28"/><path d="M1160 558c-7-31 22-51 25-84 31 29 30 62 16 84z" fill="#ffc34d"/><path d="M1177 556c-1-20 12-29 14-47 18 18 14 35 7 47z" fill="#fff2a4"/></g>
          <path d="M1018 256h336v30h-336z" fill="#3b251b" stroke="#7a4b30" strokeWidth="8"/>
        </g>

        <g className="shelves" fill="url(#timber)" stroke="#20130e" strokeWidth="6">
          <path d="M24 392h306v25H24zM24 542h306v25H24z"/>
          <path d="M43 410h24v132H43zM287 410h24v132h-24z"/>
          <path d="M1288 540h286v27h-286z"/>
        </g>
        <g fill="#715133" stroke="#251811" strokeWidth="4"><path d="M86 344h34v48H86z"/><path d="M130 356h28v36h-28z"/><path d="M178 332h39v60h-39z"/><circle cx="266" cy="364" r="28"/><path d="M1342 492h38v48h-38z"/><path d="M1393 476h42v64h-42z"/><circle cx="1490" cy="505" r="34"/></g>

        <g className="chandelier" stroke="#1a1110" strokeWidth="8">
          <path d="M800 0v148M732 148h136M742 148l-52 69M858 148l52 69" fill="none"/>
          <path d="M672 217h276" stroke="#6f4327" strokeWidth="18"/>
          <g className="candle"><path d="M700 178v39M760 168v49M840 168v49M900 178v39" stroke="#d9c39d" strokeWidth="10"/><path d="M700 174c-10-16 6-25 0-38 19 12 17 26 0 38M760 164c-10-16 6-25 0-38 19 12 17 26 0 38M840 164c-10-16 6-25 0-38 19 12 17 26 0 38M900 174c-10-16 6-25 0-38 19 12 17 26 0 38" fill="#ffc95f" stroke="#ff9d31" strokeWidth="3"/></g>
        </g>

        <path d="M0 625h1600v295H0z" fill="url(#floor)"/>
        <path d="M800 625L0 920M800 625l800 295M800 625v295M800 625L400 920M800 625l400 295" stroke="#21140f" strokeWidth="9"/>
        <path d="M0 704h1600M0 790h1600M0 882h1600" stroke="#6e4025" strokeWidth="5" opacity=".45"/>

        <g className="tavern-table">
          <ellipse cx="800" cy="710" rx="270" ry="62" fill="#1c120f" opacity=".55"/>
          <path d="M590 673h420l-38 92H628z" fill="url(#timber)" stroke="#1d120e" strokeWidth="12"/>
          <path d="M654 753h44l-23 167h-54zM902 753h44l33 167h-54z" fill="#251711"/>
          <path d="M700 650h42v29h-42zM864 643h37v36h-37z" fill="#8b633b" stroke="#24150f" strokeWidth="5"/>
          <path d="M778 660h54l14 19h-81z" fill="#d7bd89" stroke="#5f4129" strokeWidth="4"/>
        </g>

        <g className="tavern-members" filter="url(#sceneSoft)">
          <g transform="translate(380 570)"><circle cx="0" cy="0" r="33" fill="#2a1a18"/><path d="M-54 151c3-93 17-126 54-126s51 33 54 126z" fill="#39252a" stroke="#160f10" strokeWidth="9"/><path d="M-34 48h68" stroke="#955440" strokeWidth="12"/></g>
          <g transform="translate(1260 578)"><circle cx="0" cy="0" r="31" fill="#211719"/><path d="M-50 143c5-86 18-118 50-118s45 32 50 118z" fill="#263440" stroke="#100e11" strokeWidth="9"/><path d="M-27 43l54 63" stroke="#b38b57" strokeWidth="8"/></g>
          <g transform="translate(1090 700)"><circle cx="0" cy="0" r="26" fill="#211718"/><path d="M-44 128c3-75 14-104 44-104s41 29 44 104z" fill="#4d3330" stroke="#120e0f" strokeWidth="8"/></g>
        </g>
      </svg>
      <div className="tavern-ambient"/><span className="ember e1"/><span className="ember e2"/><span className="ember e3"/><span className="ember e4"/>
    </div>
  );
}

function GuildStats() {
  const query = useQuery({ queryKey: ['public', 'summary'], queryFn: () => api<GuildSummary>('/api/public/summary') });
  if (query.isLoading) return <LoadingPanel label="正在清点公会名册"/>;
  if (query.error) return <ErrorPanel error={query.error}/>;
  const entries = [
    [query.data!.memberCount, '正式成员', Users],
    [query.data!.departmentCount, '协作部门', Shield],
    [query.data!.activityCount, '活动档案', CalendarDays],
    [query.data!.workCount, '作品收录', GalleryVerticalEnd],
  ] as const;
  return <div className="ledger-stats">{entries.map(([value,label,Icon])=><article key={label}><Icon/><strong>{value}</strong><span>{label}</span></article>)}</div>;
}

export function HomePage() {
  return (
    <main className="tavern-home">
      <section className="tavern-hero">
        <TavernScene/>
        <div className="tavern-vignette"/>
        <motion.div className="tavern-title" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.8}}>
          <span className="tavern-kicker"><i/> ZOUYOU ANIME SOCIETY <i/></span>
          <div className="title-crest"><Crown/><span>Z · G</span></div>
          <h1>佐佑动漫社</h1>
          <h2>ADVENTURER GUILD</h2>
          <div className="forged-divider"><i/><b>◆</b><i/></div>
          <p>烛火未熄，欢迎归队。</p>
          <small>动漫文化让我们相遇 · 真实协作让故事继续</small>
          <div className="tavern-actions"><Link to="/departments">推开大厅之门 <ArrowRight/></Link><Link to="/join">在招募簿上留名</Link></div>
        </motion.div>
        <a className="tavern-scroll" href="#guild-ledger"><ChevronDown/><span>翻阅公会账簿</span></a>
      </section>

      <section className="guild-ledger" id="guild-ledger">
        <div className="iron-rule"><i/><span>GUILD RECORD · 013</span><i/></div>
        <div className="shell ledger-intro">
          <div><span className="chapter-mark">第一章</span><h2>这是公会，<br/>也是我们的社团。</h2></div>
          <div className="ledger-copy"><p>RPG 是我们讲故事的方式，社团管理才是这里真正发生的事情。每次活动、每件作品、每位成员的贡献，都被认真记录。</p><span><Flame/> 这不是游戏，是我们一起创造的现实。</span></div>
        </div>
        <div className="shell"><GuildStats/></div>
      </section>

      <section className="guild-board-section">
        <div className="shell board-heading"><div><span className="chapter-mark light">第二章</span><h2>六张职业委托</h2></div><p>选择的不是战斗职业，<br/>而是你愿意投入的真实协作方向。</p></div>
        <div className="guild-board shell">
          {departments.map(([name,title,slug,Icon,text],index)=><motion.article key={slug} className={`wanted-note note-${index+1}`} whileHover={{rotate:0,y:-8}}>
            <span className="pin"/><small>CLASS · 0{index+1}</small><Icon/><h3>{title}</h3><b>{name}</b><p>{text}</p><Link to={`/departments/${slug}`}>查看部门档案 <ArrowRight/></Link>
          </motion.article>)}
        </div>
        <Link className="board-all-link" to="/departments"><Shield/> 进入完整职业大厅</Link>
      </section>

      <section className="archive-passages shell">
        <div className="passage-heading"><span className="chapter-mark">第三章</span><h2>每一扇门后，<br/>都有真实记录。</h2></div>
        <div className="passage-grid">
          <Link to="/chronicle"><span>01 / HISTORY</span><BookOpen/><h3>公会编年史</h3><p>沿着年份，阅读佐佑一路留下的故事。</p><b>翻开卷宗 <ArrowRight/></b></Link>
          <Link to="/activities"><span>02 / ACTIVITIES</span><Map/><h3>冒险档案馆</h3><p>查看筹备、报名、签到与成果归档。</p><b>查看委托 <ArrowRight/></b></Link>
          <Link to="/works"><span>03 / CREATIONS</span><Palette/><h3>作品图鉴</h3><p>收藏由成员共同完成的舞台与创作。</p><b>进入图鉴 <ArrowRight/></b></Link>
        </div>
      </section>

      <section className="tavern-invitation">
        <div className="invitation-seal"><ScrollText/><span>佐佑</span></div>
        <small>RECRUITMENT SCROLL</small><h2>下一位推门而入的人，<br/>会是你吗？</h2><p>带上兴趣、技能和愿意协作的心，剩下的故事一起写。</p>
        <Link to="/join">递交入会申请 <ArrowRight/></Link>
      </section>
    </main>
  );
}
