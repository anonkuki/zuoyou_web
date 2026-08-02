import type { CSSProperties } from 'react';
import { GuildCrest } from './GuildCrest';

function ValleyCharacter({ variant, name }: { variant: number; name: string }) {
  return (
    <span className={`hero-character character-${variant}`} aria-label={name} role="img" data-pixel-detail="valley-character">
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

function CloudMass({ className, path, shade }: { className: string; path: string; shade: string }) {
  return (
    <g className={`valley-cloud ${className}`} data-cloud-mass data-pixel-detail="sunlit-cloud">
      <path d={path} fill="url(#cloudCream)" />
      <path d={shade} fill="#e9b77e" opacity=".66" />
      <path d={path} fill="none" stroke="#fff8d8" strokeWidth="7" opacity=".54" />
    </g>
  );
}

function Pine({ x, y, scale = 1, tone = '#285f53' }: { x: number; y: number; scale?: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} data-pixel-detail="valley-pine">
      <path d="M35 0L4 48h18L0 84h24L7 123h56L46 84h24L48 48h18z" fill={tone} />
      <path d="M35 15L18 48h15L17 82h18L22 111h17z" fill="#69a55b" opacity=".72" />
      <rect x="30" y="112" width="12" height="27" fill="#754e35" />
    </g>
  );
}

function LodgeWindow({ x, y, width = 52, height = 62 }: { x: number; y: number; width?: number; height?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} data-pixel-detail="lodge-window">
      <rect width={width} height={height} fill="#4d372d" rx="3" />
      <rect x="7" y="7" width={width - 14} height={height - 14} fill="url(#windowSun)" />
      <path d={`M${width / 2} 7v${height - 14}M7 ${height / 2}h${width - 14}`} stroke="#7b4831" strokeWidth="5" />
      <rect x="-5" y={height - 3} width={width + 10} height="8" fill="#d09a58" />
    </g>
  );
}

export function LuminousGuildScene() {
  return (
    <div className="layered-guild-scene luminous-valley-scene" data-testid="layered-guild-scene" aria-label="分层像素幻想公会大厅场景">
      <svg className="guild-scene-svg" viewBox="0 0 1600 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true" shapeRendering="crispEdges">
        <defs>
          <linearGradient id="dawnSky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#3f8997" /><stop offset=".52" stopColor="#78b9b2" /><stop offset="1" stopColor="#ffd493" /></linearGradient>
          <linearGradient id="cloudCream" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fffbdc" /><stop offset=".55" stopColor="#ffe7aa" /><stop offset="1" stopColor="#eab276" /></linearGradient>
          <linearGradient id="mountainMist" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#76aaa0" /><stop offset="1" stopColor="#376d69" /></linearGradient>
          <linearGradient id="meadowLight" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8fc96a" /><stop offset="1" stopColor="#376f52" /></linearGradient>
          <linearGradient id="streamLight" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#dff7d7" /><stop offset=".4" stopColor="#83cfbe" /><stop offset="1" stopColor="#3c8d8c" /></linearGradient>
          <linearGradient id="lodgeWall" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f2d29c" /><stop offset="1" stopColor="#bc8158" /></linearGradient>
          <linearGradient id="roofGreen" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4f7563" /><stop offset=".55" stopColor="#28584f" /><stop offset="1" stopColor="#173b3c" /></linearGradient>
          <linearGradient id="windowSun" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff5b0" /><stop offset=".55" stopColor="#ffc966" /><stop offset="1" stopColor="#ef8744" /></linearGradient>
          <filter id="sunBloom" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="22" /></filter>
          <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="8" /></filter>
          <pattern id="lodgeStone" width="46" height="28" patternUnits="userSpaceOnUse"><rect width="46" height="28" fill="#8d7564" /><path d="M0 2h46M0 26h46M23 0v14M8 14v14M36 14v14" stroke="#61584f" strokeWidth="3" /><path d="M4 7h14M28 7h13" stroke="#bba792" strokeWidth="2" /></pattern>
        </defs>

        <g data-scene-layer="sky-light">
          <rect width="1600" height="760" fill="url(#dawnSky)" data-pixel-detail="dawn-gradient" />
          <circle cx="322" cy="128" r="92" fill="#fff3a3" opacity=".44" filter="url(#sunBloom)" data-pixel-detail="morning-bloom" />
          <circle cx="322" cy="128" r="48" fill="#fff8c6" opacity=".92" data-pixel-detail="pixel-sun" />
          <g data-lighting="golden-hour" data-pixel-detail="golden-rays" fill="#fff5bd" opacity=".18">
            <path d="M265 160L0 373v92l333-282z" /><path d="M324 178L70 510h121l180-320z" /><path d="M383 171L248 505h96l84-316z" />
          </g>
          <g fill="#f9f0b7" opacity=".85" data-pixel-detail="sky-motes"><rect x="102" y="101" width="7" height="7" /><rect x="506" y="72" width="6" height="6" /><rect x="709" y="126" width="5" height="5" /><rect x="1290" y="82" width="6" height="6" /></g>
        </g>

        <g data-scene-layer="cloudscape">
          <CloudMass className="cloud-mass-one" path="M42 303v-36h58v-48h67v-71h78V92h104v32h69v52h83v44h108v83z" shade="M42 303v-39h116v-37h105v-42h91v46h96v30h159v42z" />
          <CloudMass className="cloud-mass-two" path="M530 272v-41h72v-56h79v-78h103v24h73v53h91v42h132v56z" shade="M530 272v-35h124v-43h112v-38h85v49h92v30h137v37z" />
          <CloudMass className="cloud-mass-three" path="M1082 311v-47h76v-69h88v-57h86v30h72v51h83v-25h75v117z" shade="M1082 311v-34h115v-42h98v-35h72v46h90v-27h105v92z" />
          <path d="M0 314h1600v58H0z" fill="#fff1c2" opacity=".18" data-pixel-detail="horizon-haze" />
        </g>

        <g data-scene-layer="far-mountains">
          <path d="M0 457L139 331l95 72 114-155 105 124 114-102 118 137 121-112 104 118 117-129 129 146 129-119 109 108 126-102 100 96v257H0z" fill="url(#mountainMist)" opacity=".78" data-pixel-detail="mist-mountains" />
          <path d="M0 491l126-84 103 56 108-79 96 73 111-65 119 83 112-74 98 64 116-77 114 83 96-60 113 66 91-52 117 71v175H0z" fill="#346e67" opacity=".76" data-pixel-detail="near-mountains" />
          <path d="M121 401l18-15 20 15M584 419l22-19 24 19M1182 421l21-18 23 18" fill="none" stroke="#d5e4c8" strokeWidth="8" opacity=".55" data-pixel-detail="mountain-caps" />
        </g>

        <g data-scene-layer="valley">
          <path d="M0 494c210-82 420-54 608 12 216 76 443 45 992-58v312H0z" fill="url(#meadowLight)" data-pixel-detail="sunlit-meadow" />
          <path d="M0 582c232-75 452-8 652 40 244 59 510 25 948-93v231H0z" fill="#4d8f5b" data-pixel-detail="rolling-valley" />
          <path d="M534 760c120-128 184-162 303-190 84-19 132-59 178-117-3 83-51 143-133 179-98 42-151 78-191 128z" fill="url(#streamLight)" data-pixel-detail="valley-stream" />
          <path d="M594 750c95-92 149-122 246-151 83-25 124-57 160-108" fill="none" stroke="#eff8cf" strokeWidth="12" opacity=".46" data-pixel-detail="stream-glint" />
          <g data-pixel-detail="distant-pines"><Pine x={60} y={392} scale={.76} /><Pine x={156} y={420} scale={.62} tone="#326f5b" /><Pine x={360} y={390} scale={.72} /><Pine x={520} y={421} scale={.55} tone="#39785e" /><Pine x={1488} y={369} scale={.8} /></g>
          <g fill="#fff1aa" data-pixel-detail="meadow-flowers"><rect x="184" y="557" width="9" height="9" /><rect x="278" y="604" width="8" height="8" /><rect x="424" y="566" width="9" height="9" /><rect x="735" y="633" width="8" height="8" /><rect x="865" y="552" width="8" height="8" /></g>
        </g>

        <g data-scene-layer="guild-lodge">
          <path d="M982 583V340h111v-91h204v76h183v258z" fill="url(#lodgeWall)" stroke="#594334" strokeWidth="9" data-pixel-detail="lodge-facade" />
          <path d="M930 355l140-151h255l122 111 90 40-21 34H949z" fill="url(#roofGreen)" stroke="#2c413b" strokeWidth="12" data-pixel-detail="lodge-roof" />
          <path d="M1027 250l86-99h139l89 99z" fill="url(#roofGreen)" stroke="#2c413b" strokeWidth="11" data-pixel-detail="lodge-dormer" />
          <path d="M959 371h553M1084 250h209" stroke="#8cad72" strokeWidth="8" opacity=".75" data-pixel-detail="moss-roof-edge" />
          <path d="M1001 389h467v194h-467z" fill="url(#lodgeStone)" opacity=".48" data-pixel-detail="stone-foundation" />
          <g stroke="#684632" strokeWidth="13" data-pixel-detail="timber-frame"><path d="M1001 377h467M1070 340v243M1309 327v256M1001 462h467" /><path d="M1004 378l67 84M1137 377l-67 85M1310 377l72 85M1455 377l-73 85" /></g>
          <LodgeWindow x={1018} y={397} /><LodgeWindow x={1392} y={397} /><LodgeWindow x={1162} y={224} width={50} height={66} />
          <path d="M1170 583V454c0-49 38-86 84-86s84 37 84 86v129" fill="#5d3829" stroke="#493126" strokeWidth="11" data-pixel-detail="lodge-door" />
          <path d="M1191 583V458c0-35 28-62 63-62s63 27 63 62v125" fill="#9a5937" /><path d="M1254 397v186M1192 494h124" stroke="#5e3428" strokeWidth="8" />
          <path d="M1139 582h230l33 22h-296zM1095 604h322l38 27h-397z" fill="#c9a273" stroke="#78604c" strokeWidth="7" data-pixel-detail="lodge-steps" />
          <g transform="translate(1100 304)" data-pixel-detail="lodge-sign"><path d="M0 0h303v82H0z" fill="#f1d49d" stroke="#594232" strokeWidth="8" /><path d="M13 13h277v56H13z" fill="#345f52" /><text x="151" y="52" textAnchor="middle" fill="#fff2c1" fontFamily="FusionPixel, sans-serif" fontSize="34">佐佑公会</text></g>
          <GuildCrest symbol transform="translate(1215 167) scale(.62 .7)" />
          <g data-pixel-detail="warm-lanterns"><path d="M1105 402v62M1376 402v62" stroke="#624433" strokeWidth="8" /><rect x="1088" y="429" width="34" height="48" fill="#4b372e" /><rect x="1096" y="437" width="18" height="32" fill="#ffd275" /><rect x="1359" y="429" width="34" height="48" fill="#4b372e" /><rect x="1367" y="437" width="18" height="32" fill="#ffd275" /></g>
          <g data-pixel-detail="lodge-chimney"><path d="M1385 260v-99h61v140" fill="#8a6b58" stroke="#4f4038" strokeWidth="9" /><path d="M1374 165h83v21h-83z" fill="#4e4037" /></g>
        </g>

        <g data-scene-layer="foreground-garden">
          <path d="M0 665c170-54 348-36 535 18 164 47 344 45 525 11 191-36 355-51 540-20v86H0z" fill="#2d684d" data-pixel-detail="foreground-grass" />
          <path d="M0 724c190-45 405-19 589 24 214 50 444-27 686-34 117-3 218 7 325 28v18H0z" fill="#1f513f" data-pixel-detail="deep-foreground" />
          <g data-pixel-detail="flower-border"><path d="M82 697h8v28h-8zM126 679h8v32h-8zM198 705h8v26h-8zM383 687h8v34h-8zM469 704h8v25h-8z" fill="#507a45" /><rect x="72" y="686" width="25" height="16" fill="#f18b8b" /><rect x="116" y="668" width="25" height="16" fill="#ffe291" /><rect x="188" y="694" width="25" height="16" fill="#d99ad3" /><rect x="373" y="676" width="25" height="16" fill="#f3a071" /><rect x="459" y="693" width="25" height="16" fill="#f6dc7b" /></g>
          <g data-pixel-detail="foreground-shrubs"><path d="M0 700v-65h39v-33h43v39h52v59zM1455 708v-62h38v-45h46v37h61v70z" fill="#173f38" /><path d="M18 670v-38h35v38M1480 673v-42h37v42" fill="#3d7d55" /></g>
          <g data-pixel-detail="wooden-waypost" transform="translate(834 595)"><rect x="34" y="0" width="15" height="113" fill="#704b32" /><path d="M0 9h105v40H0z" fill="#b77a46" stroke="#66412e" strokeWidth="6" /><text x="52" y="35" textAnchor="middle" fill="#fff0b6" fontFamily="FusionPixel, sans-serif" fontSize="19">公会大厅</text></g>
        </g>
      </svg>

      <div className="hero-atmosphere valley-atmosphere" data-atmosphere="cinematic-depth" aria-hidden="true">
        <i className="atmosphere-ray" /><i className="atmosphere-mist mist-left" /><i className="atmosphere-mist mist-right" />
        {Array.from({ length: 10 }, (_, index) => <span key={index} style={{ '--particle-index': index } as CSSProperties} data-atmosphere-particle />)}
      </div>
      <div className="hero-party valley-party" data-scene-layer="adventurer-party">
        <ValleyCharacter variant={1} name="红发冒险者" />
        <ValleyCharacter variant={2} name="公会执事" />
        <ValleyCharacter variant={3} name="绿发精灵" />
        <ValleyCharacter variant={4} name="银发法师" />
      </div>
    </div>
  );
}
