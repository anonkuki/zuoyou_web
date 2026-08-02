import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GuildStats } from './GuildStats';

function PixelCharacter({ variant, name }: { variant: number; name: string }) {
  return <span className={`hero-character character-${variant}`} aria-label={name} role="img"><i className="hair"/><i className="face"/><i className="body"/><i className="arm left"/><i className="arm right"/><i className="leg left"/><i className="leg right"/><i className="spark"/></span>;
}

function GuildScene() {
  return <div className="layered-guild-scene" data-testid="layered-guild-scene" aria-label="分层像素幻想公会大厅场景">
    <svg className="guild-scene-svg" viewBox="0 0 1600 780" preserveAspectRatio="xMidYMid slice" aria-hidden="true" shapeRendering="crispEdges">
      <defs>
        <linearGradient id="pixelSky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#27204e"/><stop offset=".48" stopColor="#68406a"/><stop offset=".77" stopColor="#ca6b61"/><stop offset="1" stopColor="#f0a65f"/></linearGradient>
        <linearGradient id="mountainFade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#43345f"/><stop offset="1" stopColor="#1f2545"/></linearGradient>
        <linearGradient id="roofPurple" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#60418c"/><stop offset=".5" stopColor="#35255f"/><stop offset="1" stopColor="#1d183e"/></linearGradient>
        <linearGradient id="stoneWall" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#705b56"/><stop offset=".5" stopColor="#493c42"/><stop offset="1" stopColor="#282733"/></linearGradient>
        <linearGradient id="windowLight"><stop stopColor="#fff1a2"/><stop offset=".5" stopColor="#f7a23c"/><stop offset="1" stopColor="#b84b2b"/></linearGradient>
        <pattern id="roofTiles" width="42" height="24" patternUnits="userSpaceOnUse"><rect width="42" height="24" fill="url(#roofPurple)"/><path d="M0 22h42M21 0v22M0 11h21M21 0h21" stroke="#17132f" strokeWidth="4"/><path d="M3 4h15M24 4h15" stroke="#7d55a5" strokeWidth="3" opacity=".5"/></pattern>
        <pattern id="stoneBlocks" width="78" height="48" patternUnits="userSpaceOnUse"><rect width="78" height="48" fill="url(#stoneWall)"/><path d="M0 2h78M0 46h78M39 0v24M0 24h78M20 24v24M60 24v24" stroke="#292530" strokeWidth="5"/><path d="M5 7h28M44 7h28M5 30h10M26 30h29M65 30h9" stroke="#8b7365" strokeWidth="3" opacity=".45"/></pattern>
        <filter id="pixelGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      <rect width="1600" height="780" fill="url(#pixelSky)"/>
      <g className="sky-clouds" fill="#f6a76f" opacity=".62">
        <path d="M-80 168h290v-28h45v-31h77v24h81v35h118v42H-80z"/><path d="M420 88h145V65h58V42h72v20h92v26h115v36H420z"/>
        <path d="M1040 135h164v-29h54V82h91v28h122v25h169v40h-600z"/>
      </g>
      <g className="sky-clouds cloud-layer-two" fill="#db7980" opacity=".38"><path d="M160 250h410v-28h90v-31h105v24h120v35h168v46H160z"/><path d="M1120 245h470v44h-470z"/></g>
      <path d="M0 470L120 320l85 62 112-197 123 184 105-97 116 115 113-142 110 143 100-82 133 150 108-135 155 141 110-98 130 121v295H0z" fill="url(#mountainFade)" opacity=".86"/>
      <path d="M0 552l108-80 92 44 94-92 80 58 82-104 91 85 116-68 91 81 112-64 105 79 120-52 106 70 105-55 108 54 110-41v313H0z" fill="#1c2941" opacity=".96"/>
      <g className="distant-city" fill="#172038"><path d="M0 620h520v160H0z"/><path d="M42 608h62v-92h22v-70h21v70h20v92h66v-57h54v57h74v-89h36v-48h26v48h34v89h63v172H0z"/></g>
      <g fill="#ec9a4b" opacity=".8"><rect x="71" y="551" width="10" height="13"/><rect x="158" y="587" width="12" height="15"/><rect x="272" y="567" width="10" height="13"/><rect x="384" y="543" width="12" height="16"/><rect x="455" y="595" width="9" height="12"/></g>

      <g className="guild-building">
        <path d="M742 202h128V95h102v107h153V82h134v120h183v391H742z" fill="url(#stoneBlocks)" stroke="#181722" strokeWidth="12"/>
        <path d="M690 231l95-138h190l85 138zM995 116L1130 0h186l169 170-56 52H995zM1212 209l116-135h152l120 135z" fill="url(#roofTiles)" stroke="#17132d" strokeWidth="14"/>
        <path d="M766 112h168l-24-76H790zM1068 44h317l-60-62h-191z" fill="url(#roofTiles)" stroke="#211936" strokeWidth="10"/>
        <path d="M1061 593V390c0-67 54-120 121-120s121 53 121 120v203" fill="#2b211f" stroke="#171419" strokeWidth="15"/>
        <path d="M1094 593V402c0-44 39-83 88-83s88 39 88 83v191" fill="#563121" stroke="#c07838" strokeWidth="7"/>
        <path d="M1182 319v274M1096 452h172" stroke="#2a1915" strokeWidth="10"/>
        <g fill="url(#windowLight)" stroke="#24191b" strokeWidth="8" filter="url(#pixelGlow)"><path d="M824 294v-74c0-22 15-39 34-39s34 17 34 39v74z"/><path d="M1355 303v-74c0-22 15-39 34-39s34 17 34 39v74z"/><path d="M1150 201v-77c0-22 15-39 34-39s34 17 34 39v77z"/><path d="M1505 424v-67c0-20 14-35 31-35s31 15 31 35v67z"/></g>
        <g stroke="#3b2825" strokeWidth="8"><path d="M858 183v111M824 250h68"/><path d="M1389 190v113M1355 258h68"/><path d="M1184 86v115M1150 158h68"/></g>
        <path d="M1004 235h358v112h-358z" fill="#34201a" stroke="#bd7838" strokeWidth="8"/><path d="M1023 253h320v76h-320z" fill="#55301f" stroke="#211512" strokeWidth="5"/>
        <text x="1183" y="307" textAnchor="middle" fill="#f8d77c" fontFamily="serif" fontSize="45" fontWeight="800">公会大厅</text>
        <g className="guild-banners"><path d="M989 86h134v220l-67-33-67 33z" fill="#392b91" stroke="#d59739" strokeWidth="8"/><path d="M1022 112h68v127l-34 21-34-21z" fill="#5534b5"/><path d="M1056 131l13 33 35 3-27 22 9 35-30-19-30 19 9-35-27-22 35-3z" fill="#f5c44f"/>
          <path d="M822 340h74v167l-37-24-37 24zM1420 330h74v172l-37-24-37 24z" fill="#432d9d" stroke="#d4983f" strokeWidth="6"/><path d="M852 376h14v69h-14zM1450 366h14v72h-14z" fill="#f2c556"/>
        </g>
        <g className="wall-torches"><path d="M1027 374v54M1338 367v54" stroke="#4a2b1e" strokeWidth="9"/><path d="M1013 373c-13-31 15-40 13-72 33 27 30 52 8 72zM1324 366c-13-31 15-40 13-72 33 27 30 52 8 72z" fill="#ffb63d" stroke="#e85e27" strokeWidth="5" filter="url(#pixelGlow)"/></g>
      </g>
      <path d="M0 610c270-70 505-35 707 3 215 40 471-13 893-31v198H0z" fill="#1c2a28"/><path d="M0 682c283-54 493 12 724 41 268 34 508-33 876-20v77H0z" fill="#263f32"/>
      <path d="M1050 780c22-96 68-159 132-187 73 31 121 94 145 187" fill="#a47d58" opacity=".75"/><path d="M1068 780c25-70 60-115 114-146 56 29 95 77 126 146" fill="#d4b77f" opacity=".55"/>
      <g className="foreground-plants" fill="#355a3e"><path d="M645 699l-32-72 45 39 9-76 19 74 43-51-21 80zM1490 684l-24-70 39 39 9-71 20 70 36-49-15 77z"/></g>
      <g className="lamp-post" transform="translate(40 405)"><path d="M33 0v280M0 280h66" stroke="#1c1719" strokeWidth="16"/><path d="M4 18h58v88H4z" fill="#3b2821" stroke="#151316" strokeWidth="9"/><path d="M18 31h30v58H18z" fill="url(#windowLight)" filter="url(#pixelGlow)"/><path d="M-5 18l38-40 38 40z" fill="#21181b"/></g>
    </svg>
    <div className="moving-cloud cloud-a"/><div className="moving-cloud cloud-b"/>
    <div className="hero-party"><PixelCharacter variant={1} name="红发冒险者"/><PixelCharacter variant={2} name="公会执事"/><PixelCharacter variant={3} name="绿发精灵"/><PixelCharacter variant={4} name="银发法师"/></div>
  </div>;
}

export function GuildHero() {
  return <section className="guild-hero">
    <GuildScene/>
    <motion.div className="guild-hero-copy" initial={{opacity:0,x:-28}} animate={{opacity:1,x:0}} transition={{duration:.7}}>
      <span className="hero-mini-crest">✦</span>
      <h1>佐佑动漫社</h1>
      <div className="hero-title-plaque">冒险者公会</div>
      <b>ZOUYOU ANIME GUILD</b>
      <p><span>我们是来自不同世界的冒险者，</span><span>因为热爱动漫而相聚，</span><span>在此书写属于我们的故事。</span></p>
      <div><Link className="hero-pixel-button gold" to="/departments">探索公会 <ArrowRight/></Link><Link className="hero-pixel-button blue" to="/join">加入冒险 <ArrowRight/></Link></div>
    </motion.div>
    <GuildStats/>
  </section>;
}
