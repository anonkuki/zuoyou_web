import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { GuildStats } from './GuildStats';
import { GuildCrest } from './GuildCrest';

const facadeStones = [
  [704, 294, 72, 23], [784, 284, 92, 28], [884, 301, 66, 22], [966, 282, 82, 26],
  [1061, 296, 74, 24], [1151, 279, 90, 28], [1253, 302, 67, 22], [1335, 283, 82, 27],
  [716, 337, 90, 25], [818, 329, 68, 20], [900, 348, 88, 24], [1000, 326, 67, 22],
  [1082, 344, 83, 25], [1180, 327, 70, 22], [1264, 347, 91, 25], [1369, 331, 54, 21],
  [700, 390, 67, 23], [779, 376, 88, 27], [883, 399, 61, 21], [1311, 392, 76, 24],
  [714, 438, 89, 25], [817, 420, 66, 21], [895, 447, 73, 24], [1328, 438, 88, 25],
  [706, 493, 68, 22], [787, 477, 94, 28], [897, 506, 56, 20], [1312, 491, 72, 24],
] as const;

function PixelCharacter({ variant, name }: { variant: number; name: string }) {
  return (
    <span className={`hero-character character-${variant}`} aria-label={name} role="img" data-pixel-detail="character">
      <i className="character-shadow" />
      <i className="hair back" /><i className="face" /><i className="hair front" />
      <i className="eye left" /><i className="eye right" />
      <i className="body" /><i className="collar" /><i className="belt" />
      <i className="arm left" /><i className="arm right" /><i className="hand left" /><i className="hand right" />
      <i className="leg left" /><i className="leg right" /><i className="boot left" /><i className="boot right" />
      <i className="accessory" /><i className="spark" />
    </span>
  );
}

function LitWindow({ x, y, width = 58, height = 88 }: { x: number; y: number; width?: number; height?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} data-pixel-detail="lit-window">
      <path d={`M0 ${height}V26C0 10 12 0 ${width / 2} 0S${width} 10 ${width} 26v${height - 26}z`} fill="#251719" stroke="#120e16" strokeWidth="12" />
      <path d={`M10 ${height - 10}V29c0-11 8-18 ${width / 2 - 10}-18s${width / 2 - 10} 7 ${width / 2 - 10} 18v${height - 39}z`} fill="url(#windowLight)" />
      <path d={`M${width / 2} 13v${height - 24}M10 ${height * .55}h${width - 20}`} stroke="#5b2d22" strokeWidth="7" />
      <path d={`M4 ${height + 4}h${width + 8}`} stroke="#b87a43" strokeWidth="8" />
    </g>
  );
}

function GuildScene() {
  return (
    <div className="layered-guild-scene" data-testid="layered-guild-scene" aria-label="分层像素幻想公会大厅场景">
      <svg className="guild-scene-svg" viewBox="0 0 1600 780" preserveAspectRatio="xMidYMid slice" aria-hidden="true" shapeRendering="crispEdges">
        <defs>
          <linearGradient id="pixelSky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#241a4b" /><stop offset=".45" stopColor="#5b3568" /><stop offset=".72" stopColor="#b75f68" /><stop offset="1" stopColor="#f0a064" /></linearGradient>
          <linearGradient id="mountainFade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#57406d" /><stop offset="1" stopColor="#202643" /></linearGradient>
          <linearGradient id="roofPurple" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#7552a1" /><stop offset=".5" stopColor="#3d2868" /><stop offset="1" stopColor="#211943" /></linearGradient>
          <linearGradient id="stoneWall" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#79645d" /><stop offset=".5" stopColor="#4c3f43" /><stop offset="1" stopColor="#292833" /></linearGradient>
          <linearGradient id="windowLight" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff3a5" /><stop offset=".42" stopColor="#ffb33d" /><stop offset="1" stopColor="#c34f28" /></linearGradient>
          <pattern id="roofTiles" width="36" height="20" patternUnits="userSpaceOnUse"><rect width="36" height="20" fill="url(#roofPurple)" /><path d="M0 18h36M18 0v18M0 9h18M18 0h18" stroke="#18122f" strokeWidth="4" /><path d="M3 3h12M21 3h12" stroke="#9670bd" strokeWidth="3" opacity=".55" /></pattern>
          <pattern id="stoneBlocks" width="72" height="42" patternUnits="userSpaceOnUse"><rect width="72" height="42" fill="url(#stoneWall)" /><path d="M0 2h72M0 40h72M36 0v21M0 21h72M18 21v21M55 21v21" stroke="#28242e" strokeWidth="5" /><path d="M5 7h26M42 7h24M5 27h9M24 27h25M60 27h8" stroke="#9a8172" strokeWidth="3" opacity=".48" /></pattern>
          <pattern id="cobble" width="54" height="28" patternUnits="userSpaceOnUse"><rect width="54" height="28" fill="#a68361" /><path d="M0 3h54M0 26h54M27 0v14M10 14v14M43 14v14" stroke="#6e5749" strokeWidth="4" /><path d="M5 8h17M31 8h17" stroke="#cdb284" strokeWidth="2" /></pattern>
          <filter id="pixelGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        <g data-scene-layer="sky">
          <rect width="1600" height="780" fill="url(#pixelSky)" />
          <g className="sky-clouds" fill="#f7a06f" opacity=".7" data-pixel-detail="sunset-clouds"><path d="M-80 140h110v-24h52V93h87v18h93v29h168v42H-80z" /><path d="M395 90h105V68h55V44h71v18h87v28h150v36H395z" /><path d="M1110 118h114V94h52V70h92v26h112v22h160v43h-530z" /></g>
          <g className="sky-clouds cloud-layer-two" fill="#d9747e" opacity=".43"><path d="M20 236h392v-29h93v-28h102v22h145v35h145v39H20z" /><path d="M1040 224h560v50h-560z" /></g>
          <path d="M0 451L95 336l79 44 103-187 98 137 81-73 108 120 99-136 106 142 91-80 111 129 98-124 132 127 95-88 124 111 100-76v388H0z" fill="url(#mountainFade)" />
          <path d="M0 520l108-67 88 36 84-72 76 47 91-94 89 78 105-62 83 72 104-54 97 67 112-47 97 59 91-49 98 49 87-35 110 48v314H0z" fill="#1b2941" />
        </g>

        <g data-scene-layer="distant-town">
          <path d="M0 578h535v202H0z" fill="#182237" />
          <path d="M42 574h54V484h17v-64h17v-54h17v54h18v64h22v90h48v-61h53v61h63v-86h30v-50h24v50h31v86h67V459h41v115h31v206H0z" fill="#141b31" data-pixel-detail="castle-silhouette" />
          <path d="M0 626h577v154H0z" fill="#1c2639" />
          {[[68,545],[156,575],[242,552],[314,593],[388,532],[451,584],[508,557],[117,631],[279,650],[421,625]].map(([x,y]) => <rect key={`${x}-${y}`} x={x} y={y} width="9" height="12" fill="#eda052" opacity=".82" data-pixel-detail="town-light" />)}
          <g fill="#25334a" stroke="#141a2c" strokeWidth="7" data-pixel-detail="village-roofs"><path d="M-20 654l87-90 87 90z" /><path d="M105 667l76-77 76 77z" /><path d="M225 640l90-96 90 96z" /><path d="M370 667l84-84 84 84z" /></g>
        </g>

        <g className="guild-building" data-scene-layer="guild-building">
          <path d="M674 610V245h136V156h126v58h151V103h154v91h163v51h87v365z" fill="url(#stoneBlocks)" stroke="#15131c" strokeWidth="13" data-pixel-detail="stone-facade" />
          <path d="M635 257L756 104h194l100 153zM924 193L1081 22h232l177 188-51 48H924zM1240 250l116-129h143l118 129z" fill="url(#roofTiles)" stroke="#17122d" strokeWidth="15" data-pixel-detail="purple-roof" />
          <path d="M699 122h201l-29-85H729zM1060 68h339l-67-67h-207zM1329 125h192l-29-79h-130z" fill="url(#roofTiles)" stroke="#1a1431" strokeWidth="12" data-pixel-detail="roof-ridges" />
          <path d="M658 257h305M951 194h498M1251 250h351" stroke="#a16d55" strokeWidth="7" opacity=".65" />
          <g opacity=".76">{facadeStones.map(([x,y,w,h]) => <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="2" fill="none" stroke="#a48673" strokeWidth="4" data-pixel-detail="individual-stone" />)}</g>
          <path d="M974 610V405c0-79 56-137 130-137s130 58 130 137v205" fill="#241a1b" stroke="#151117" strokeWidth="16" data-pixel-detail="arched-entry" />
          <path d="M1006 610V409c0-56 43-101 98-101s98 45 98 101v201" fill="#603522" stroke="#b76b31" strokeWidth="8" />
          <path d="M1104 309v301M1008 456h192" stroke="#281713" strokeWidth="11" />
          <path d="M1020 601h168l35 27H985z" fill="#c09a6e" stroke="#634731" strokeWidth="7" /><path d="M995 628h221l36 27H960z" fill="#aa815e" stroke="#5c4436" strokeWidth="7" data-pixel-detail="entry-steps" />
          <g fill="#342019" stroke="#211411" strokeWidth="7" data-pixel-detail="timber-frame"><path d="M690 266h264v18H690zM1271 267h189v18h-189z" /><path d="M783 216h18v184h-18zM1368 202h18v199h-18z" /><path d="M684 386l122-118 14 15-122 118zM947 385L806 270l-14 16 141 115z" /></g>
          <g data-pixel-detail="dormers"><path d="M742 193l61-73 63 73z" fill="url(#roofTiles)" stroke="#17122d" strokeWidth="10" /><path d="M1307 182l67-72 68 72z" fill="url(#roofTiles)" stroke="#17122d" strokeWidth="10" /><LitWindow x={776} y={153} width={42} height={68} /><LitWindow x={1349} y={142} width={44} height={70} /></g>
        </g>

        <g data-scene-layer="architectural-lighting">
          <LitWindow x={724} y={306} width={58} height={92} /><LitWindow x={842} y={248} width={54} height={86} /><LitWindow x={1279} y={282} width={56} height={90} /><LitWindow x={1402} y={328} width={54} height={86} /><LitWindow x={1122} y={111} width={58} height={92} />
          <g className="guild-banners" data-pixel-detail="guild-banners">
            <path d="M955 93h142v223l-71-37-71 37z" fill="#3b2694" stroke="#e0a23d" strokeWidth="9" />
            <path d="M985 119h82v134l-41 22-41-22z" fill="#5637be" />
            <GuildCrest symbol transform="translate(986 125) scale(.8 1.25)" />
            <path d="M824 340h78v177l-39-25-39 25zM1350 337h78v177l-39-25-39 25z" fill="#432aa1" stroke="#d99a3e" strokeWidth="7" /><path d="M855 376h16v78h-16zM1381 374h16v78h-16z" fill="#f7c851" />
          </g>
          <g data-pixel-detail="guild-sign"><path d="M947 254h365v104H947z" fill="#271713" stroke="#17100f" strokeWidth="11" /><path d="M963 267h333v77H963z" fill="#5a311d" stroke="#b87332" strokeWidth="7" /><text x="1130" y="322" textAnchor="middle" fill="#ffe096" fontFamily="FusionPixel, sans-serif" fontSize="44">公会大厅</text></g>
          <g className="wall-torches" data-pixel-detail="torch-pair"><path d="M949 359v70M1309 355v70" stroke="#4b2d20" strokeWidth="10" /><path d="M933 359c-14-34 17-45 14-80 36 30 34 58 9 80zM1293 355c-14-34 17-45 14-80 36 30 34 58 9 80z" fill="#ffba3f" stroke="#ef642a" strokeWidth="6" filter="url(#pixelGlow)" /></g>
          <g data-pixel-detail="hanging-lanterns"><path d="M678 330h35v61h-35zM1468 286h35v61h-35z" fill="#2a1a19" stroke="#110e12" strokeWidth="8" /><path d="M686 341h19v38h-19zM1476 297h19v38h-19z" fill="url(#windowLight)" filter="url(#pixelGlow)" /></g>
        </g>

        <g data-scene-layer="foreground">
          <path d="M0 607c270-66 485-37 663 4 238 54 513-20 937-31v200H0z" fill="#172b27" data-pixel-detail="grass-bank" />
          <path d="M0 691c253-56 474 7 697 35 282 36 521-31 903-20v74H0z" fill="#294535" />
          <path d="M939 780c27-102 78-168 165-198 91 31 150 99 181 198z" fill="url(#cobble)" opacity=".9" data-pixel-detail="cobblestone-path" />
          <g className="foreground-plants" fill="#3c6848" data-pixel-detail="plants"><path d="M618 711l-30-84 45 46 10-88 21 84 44-59-20 96zM1502 693l-26-77 42 43 10-80 21 79 39-55-16 84z" /></g>
          <g className="lamp-post" transform="translate(35 407)" data-pixel-detail="street-lantern"><path d="M34 0v285M0 285h68" stroke="#171318" strokeWidth="17" /><path d="M4 19h60v91H4z" fill="#3a2720" stroke="#121014" strokeWidth="10" /><path d="M18 32h32v61H18z" fill="url(#windowLight)" filter="url(#pixelGlow)" /><path d="M-4 19L34-23 72 19z" fill="#21171a" /></g>
          <g transform="translate(1471 527)" data-pixel-detail="barrels"><ellipse cx="31" cy="19" rx="30" ry="15" fill="#8a582d" stroke="#302019" strokeWidth="7" /><path d="M1 19v80c0 20 60 20 60 0V19" fill="#734423" stroke="#302019" strokeWidth="7" /><path d="M2 50h59M2 82h59" stroke="#bd8243" strokeWidth="7" /></g>
          <g data-pixel-detail="flowers" fill="#d7568f"><rect x="642" y="600" width="9" height="9" /><rect x="657" y="588" width="9" height="9" /><rect x="1462" y="603" width="9" height="9" /><rect x="1481" y="591" width="9" height="9" /></g>
        </g>
      </svg>
      <div className="moving-cloud cloud-a" /><div className="moving-cloud cloud-b" />
      <div className="hero-atmosphere" data-atmosphere="cinematic-depth" aria-hidden="true">
        <i className="atmosphere-ray" /><i className="atmosphere-mist mist-left" /><i className="atmosphere-mist mist-right" />
        {Array.from({ length: 10 }, (_, index) => <span key={index} style={{ '--particle-index': index } as CSSProperties} data-atmosphere-particle />)}
      </div>
      <div className="hero-party" data-scene-layer="adventurer-party">
        <PixelCharacter variant={1} name="红发冒险者" />
        <PixelCharacter variant={2} name="公会执事" />
        <PixelCharacter variant={3} name="绿发精灵" />
        <PixelCharacter variant={4} name="银发法师" />
      </div>
    </div>
  );
}

export function GuildHero() {
  return (
    <section className="guild-hero">
      <GuildScene />
      <motion.div className="guild-hero-copy" data-visual-priority="primary" initial={{ x: -28 }} animate={{ x: 0 }} transition={{ duration: .7 }}>
        <span className="hero-mini-crest">✦</span>
        <h1>佐佑动漫社</h1>
        <div className="hero-title-plaque">冒险者公会</div>
        <b>ZOUYOU ANIME GUILD</b>
        <p><span>我们是来自不同世界的冒险者，</span><span>因为热爱动漫而相聚，</span><span>在此书写属于我们的故事。</span></p>
        <div><Link className="hero-pixel-button gold" to="/departments">探索公会 <ArrowRight /></Link><Link className="hero-pixel-button blue" to="/join">加入冒险 <ArrowRight /></Link></div>
      </motion.div>
      <GuildStats />
    </section>
  );
}
