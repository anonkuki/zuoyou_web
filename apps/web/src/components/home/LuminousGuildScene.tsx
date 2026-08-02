import type { CSSProperties } from 'react';
import { GuildCrest } from './GuildCrest';

type CloudProps = { x: number; y: number; scale?: number; className: string; variant: 1 | 2 | 3 | 4 };

const cloudShapes = {
  1: {
    light: 'M0 40V31h8v-9h12v-9h14V7h18V2h20v6h17v8h15v7h20v8h16v17H0z',
    mid: 'M0 48V38h17v-8h19v-8h18v8h20v-6h19v9h25v7h22v8H0z',
    shine: 'M7 33v-8h14v-8h13v-7h16v7H39v9H25v7zm50-19V8h14v6h14v7H72v7H57v-7h9v-7z',
    shade: 'M18 43v-7h22v-8h17v8h21v-6h21v9h25v9H18z',
  },
  2: {
    light: 'M0 48V36h11V26h15V15h17V8h21V0h19v7h14v12h18v8h16v9h18v17H0z',
    mid: 'M0 53V42h21v-8h20v-9h18v11h19v-8h21v9h28v7h22v9H0z',
    shine: 'M12 34v-8h14v-9h16V9h20v9H49v8H34v8zm57-20V7h13v8h14v9H82v7H67v-8h9v-9z',
    shade: 'M21 48v-8h24v-8h18v9h22v-7h21v10h27v9H21z',
  },
  3: {
    light: 'M0 43V34h14v-7h12V16h20V8h18v5h18v-4h17v10h18v7h18v9h20v14H0z',
    mid: 'M0 49V40h20v-7h21v-8h19v9h18v-7h21v9h28v6h28v7H0z',
    shine: 'M12 32v-7h15v-7h18v-6h17v8H48v7H34v6zm55-13v-5h15v6h14v8H82v6H66v-7h10v-8z',
    shade: 'M19 45v-7h25v-7h19v9h22v-7h21v9h28v7H19z',
  },
  4: {
    light: 'M0 46V35h9v-8h13V18h13V8h20V3h20v6h16v9h18v-4h17v11h16v9h20v18H0z',
    mid: 'M0 52V42h18v-8h19v-7h18v9h20v-8h19v10h25v-7h20v12h23v9H0z',
    shine: 'M8 34v-7h14v-7h13v-8h18v8H41v8H28v6zm52-18v-6h14v7h14v8H74v7H59v-8h9v-8z',
    shade: 'M18 48v-7h23v-8h18v9h21v-7h20v9h25v-7h20v15H18z',
  },
} as const;

function PixelCloud({ x, y, scale = 1, className, variant }: CloudProps) {
  const shape = cloudShapes[variant];
  return (
    <g className={`painted-cloud ${className}`} transform={`translate(${x} ${y}) scale(${scale})`} data-cloud-mass data-pixel-detail="painted-cloud-volume">
      <path d={shape.light} fill="#fff4bb" />
      <path d={shape.mid} fill="#f3cd82" />
      <path d={shape.shine} fill="#fffbe0" data-pixel-detail="cloud-highlight" />
      <path d={shape.shade} fill="#e6a268" opacity=".76" data-pixel-detail="cloud-shadow" />
      <path d="M6 49h122v3H6z" fill="#d3825c" opacity=".25" />
    </g>
  );
}

function PixelPine({ x, y, scale = 1, tone = '#225a4d' }: { x: number; y: number; scale?: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} data-pixel-detail="layered-pine">
      <rect x="8" y="26" width="4" height="13" fill="#6d4934" />
      <path d="M10 0 3 10h4L1 20h5L0 31h20l-6-11h5l-6-10h4z" fill={tone} />
      <path d="M10 3 6 10h4L5 20h5L5 27h5z" fill="#6f9c58" opacity=".78" />
      <rect x="4" y="26" width="3" height="2" fill="#b4c96c" opacity=".65" />
    </g>
  );
}

function PixelWindow({ x, y, wide = false }: { x: number; y: number; wide?: boolean }) {
  const width = wide ? 18 : 12;
  return (
    <g transform={`translate(${x} ${y})`} data-pixel-detail="warm-window">
      <rect width={width} height="15" fill="#402f2b" />
      <rect x="2" y="2" width={width - 4} height="11" fill="#ffce67" className="window-flicker" />
      <rect x={width / 2 - 1} y="2" width="2" height="11" fill="#9c5635" />
      <rect x="2" y="7" width={width - 4} height="2" fill="#9c5635" />
      <rect x="-1" y="15" width={width + 2} height="2" fill="#d49555" />
    </g>
  );
}

const adventurers = [
  { x: 282, hair: '#d74b70', coat: '#e96668', accent: '#ffd36b', name: '红发冒险者' },
  { x: 297, hair: '#5a382b', coat: '#345b72', accent: '#eeb45b', name: '公会执事' },
  { x: 312, hair: '#62a865', coat: '#416f58', accent: '#89d6c8', name: '绿发精灵' },
  { x: 327, hair: '#e7e1d8', coat: '#59628d', accent: '#b5c7ff', name: '银发法师' },
] as const;

function PixelAdventurer({ x, hair, coat, accent, name, index }: (typeof adventurers)[number] & { index: number }) {
  return (
    <g className={`svg-adventurer adventurer-${index + 1}`} transform={`translate(${x} 129) scale(1.12)`} role="img" aria-label={name} data-pixel-detail="original-pixel-adventurer">
      <rect x="-2" y="24" width="14" height="3" fill="#24483f" opacity=".35" />
      <rect x="1" y="4" width="8" height="8" fill="#f3c89f" />
      <path d="M0 3h2V1h7v2h2v7H9V6H7v3H5V6H3v4H0z" fill={hair} />
      <rect x="2" y="6" width="1" height="1" fill="#2d2631" /><rect x="7" y="6" width="1" height="1" fill="#2d2631" />
      <path d="M1 12h8l2 9H8v4H5v-4H0z" fill={coat} />
      <rect x="1" y="14" width="8" height="2" fill={accent} />
      <rect x="-2" y="13" width="3" height="7" fill={coat} /><rect x="9" y="13" width="3" height="7" fill={coat} />
      <rect x="0" y="20" width="4" height="3" fill="#392f36" /><rect x="7" y="20" width="4" height="3" fill="#392f36" />
      <rect x={index % 2 ? -4 : 11} y="11" width="2" height="10" fill={accent} />
      <rect x={index % 2 ? -5 : 10} y="10" width="4" height="3" fill="#fff0a7" />
    </g>
  );
}

export function LuminousGuildScene() {
  return (
    <div className="layered-guild-scene luminous-valley-scene" data-testid="layered-guild-scene" aria-label="分层像素幻想公会大厅场景">
      <svg className="guild-scene-svg" viewBox="0 0 400 190" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" data-rendering="low-resolution-pixel-art">
        <defs>
          <linearGradient id="pixelSky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#397e9b" /><stop offset=".52" stopColor="#62a7ad" /><stop offset="1" stopColor="#e5bd78" /></linearGradient>
          <linearGradient id="pixelMeadow" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8fc666" /><stop offset="1" stopColor="#3c7552" /></linearGradient>
          <linearGradient id="pixelStream" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d8f0c3" /><stop offset=".45" stopColor="#76c8b6" /><stop offset="1" stopColor="#3b898b" /></linearGradient>
          <linearGradient id="pixelRoof" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#355f55" /><stop offset="1" stopColor="#173a3a" /></linearGradient>
          <pattern id="pixelShingles" width="8" height="5" patternUnits="userSpaceOnUse"><rect width="8" height="5" fill="#285148" /><path d="M0 4h8M4 0v4" stroke="#173b38" strokeWidth="1" /><path d="M1 1h3" stroke="#557c61" strokeWidth="1" /></pattern>
          <pattern id="pixelStone" width="12" height="7" patternUnits="userSpaceOnUse"><rect width="12" height="7" fill="#b9855f" /><path d="M0 1h12M0 6h12M5 1v5" stroke="#8b624c" strokeWidth="1" /><path d="M1 3h3M7 3h4" stroke="#d6aa77" strokeWidth="1" /></pattern>
        </defs>

        <g data-scene-layer="sky-light">
          <rect width="400" height="190" fill="url(#pixelSky)" data-pixel-detail="banded-dawn-sky" />
          <rect y="74" width="400" height="8" fill="#f6c986" opacity=".34" data-pixel-detail="warm-horizon-band" />
          <g data-lighting="golden-hour" data-pixel-detail="golden-hour-rays" fill="#fff4b2" opacity=".17">
            <path d="M56 24 0 93v22L72 30z" /><path d="m69 28-31 92h25l17-88z" /><path d="m82 30 4 85h18L92 28z" />
          </g>
          <g data-pixel-detail="square-sun"><rect x="57" y="19" width="20" height="20" fill="#fff4a5" /><rect x="53" y="23" width="28" height="12" fill="#fff4a5" /><rect x="61" y="15" width="12" height="28" fill="#fff8c7" /></g>
          <g fill="#fff6b4" data-pixel-detail="sky-sparks"><rect x="20" y="30" width="1" height="1" /><rect x="104" y="17" width="2" height="2" /><rect x="211" y="28" width="1" height="1" /><rect x="365" y="18" width="2" height="2" /><rect x="338" y="48" width="1" height="1" /></g>
        </g>

        <g data-scene-layer="cloudscape">
          <PixelCloud className="cloud-one" x={-12} y={28} scale={.82} variant={1} />
          <PixelCloud className="cloud-two" x={57} y={9} scale={1.16} variant={2} />
          <PixelCloud className="cloud-three" x={201} y={30} scale={.84} variant={3} />
          <PixelCloud className="cloud-four" x={286} y={15} scale={.9} variant={4} />
          <path d="M0 75h400v12H0z" fill="#ffe2a0" opacity=".23" data-pixel-detail="cloud-haze" />
        </g>

        <g data-scene-layer="far-mountains">
          <path d="m0 111 27-25 15 12 24-34 18 22 20-18 27 29 24-24 24 24 31-29 30 31 30-23 27 23 29-28 28 29 22-20 44 32v41H0z" fill="#6fa39a" opacity=".72" data-pixel-detail="misty-mountain-range" />
          <path d="m0 126 24-18 21 12 26-20 23 19 27-15 26 19 25-18 27 18 25-16 28 21 30-20 30 22 23-17 32 20 27-18 33 24v28H0z" fill="#39766c" data-pixel-detail="near-mountain-range" />
          <g fill="#dce6be" opacity=".58" data-pixel-detail="mountain-light"><path d="m62 100 9-8 10 9-9-5z" /><path d="m149 103 8-8 8 8-8-4z" /><path d="m276 107 8-7 9 8-9-4z" /></g>
          <g data-pixel-detail="distant-tree-line"><PixelPine x={10} y={94} scale={.62} /><PixelPine x={38} y={103} scale={.48} tone="#336f5c" /><PixelPine x={118} y={99} scale={.55} /><PixelPine x={194} y={102} scale={.48} /><PixelPine x={360} y={96} scale={.62} /></g>
        </g>

        <g data-scene-layer="valley">
          <path d="M0 124 44 111l46 8 48-7 47 15 49-7 51 10 50-15 65 2v73H0z" fill="url(#pixelMeadow)" data-pixel-detail="sunlit-valley" />
          <path d="m0 143 49-11 47 6 41-4 52 13 50-6 52 8 51-14 58 4v51H0z" fill="#4b8d59" data-pixel-detail="rolling-meadow" />
          <path d="M81 190h74l26-17 20-8 17-15 7-19-13 17-21 11-24 9-30 8z" fill="url(#pixelStream)" data-pixel-detail="winding-stream" />
          <path d="m112 186 36-12 27-8 19-9 13-11" fill="none" stroke="#eaffc9" strokeWidth="3" opacity=".62" data-pixel-detail="stream-sun-glint" />
          <path d="m214 152 24-12 27-4 30 5 23 12-37 9-37-2z" fill="#d8c486" opacity=".58" data-pixel-detail="guild-path" />
          <g fill="#fff0a2" data-pixel-detail="meadow-flower-field"><rect x="28" y="139" width="2" height="2" /><rect x="50" y="151" width="2" height="2" /><rect x="70" y="132" width="2" height="2" /><rect x="104" y="147" width="2" height="2" /><rect x="128" y="137" width="2" height="2" /><rect x="235" y="151" width="2" height="2" /><rect x="354" y="142" width="2" height="2" /></g>
          <g fill="#f18979" data-pixel-detail="coral-flowers"><rect x="37" y="145" width="3" height="3" /><rect x="91" y="155" width="3" height="3" /><rect x="120" y="144" width="3" height="3" /><rect x="228" y="158" width="3" height="3" /></g>
          <g data-pixel-detail="distant-village" opacity=".82"><path d="m154 128 7-6 7 6v9h-14zm23 3 6-5 6 5v8h-12zm18-5 8-7 8 7v12h-16z" fill="#6e5846" /><path d="m152 128 9-8 9 8zm23 3 8-7 8 7zm18-5 10-9 10 9z" fill="#355e50" /><rect x="159" y="130" width="3" height="3" fill="#ffd97a" /><rect x="181" y="132" width="2" height="2" fill="#ffd97a" /><rect x="201" y="128" width="3" height="3" fill="#ffd97a" /></g>
        </g>

        <g data-scene-layer="guild-lodge">
          <path d="M250 164V98h28V75h50v17h51v72z" fill="url(#pixelStone)" stroke="#543d34" strokeWidth="3" data-pixel-detail="guild-facade" />
          <path d="m239 101 33-35h62l28 25 24 10-6 10H244z" fill="url(#pixelShingles)" stroke="#1d403d" strokeWidth="4" data-pixel-detail="main-roof" />
          <path d="m269 77 20-24h35l22 24z" fill="url(#pixelRoof)" stroke="#1d403d" strokeWidth="3" data-pixel-detail="tower-roof" />
          <path d="M244 106h136M276 76h66" stroke="#719267" strokeWidth="2" data-pixel-detail="mossy-roof-trim" />
          <path d="M254 106h121v58H254z" fill="url(#pixelStone)" opacity=".82" data-pixel-detail="stone-wall-texture" />
          <g stroke="#694834" strokeWidth="3" data-pixel-detail="timber-frame"><path d="M252 104h126M270 98v66M350 93v71M252 133h126" /><path d="m253 105 17 28 18-28m45 0 17 28 25-28" /></g>
          <PixelWindow x={257} y={113} /><PixelWindow x={357} y={113} /><PixelWindow x={302} y={57} wide />
          <path d="M294 164v-31c0-13 10-23 23-23s23 10 23 23v31z" fill="#513128" stroke="#3b2926" strokeWidth="3" data-pixel-detail="arched-guild-door" />
          <path d="M300 164v-30c0-9 7-16 17-16s17 7 17 16v30z" fill="#9c5936" /><path d="M317 118v46m-17-22h34" stroke="#5b342a" strokeWidth="2" />
          <path d="M286 164h62l8 5h-78zm-12 5h86l9 6H266z" fill="#d4b07b" stroke="#745a43" strokeWidth="2" data-pixel-detail="stone-steps" />
          <g transform="translate(279 84)" data-pixel-detail="guild-name-sign"><rect width="76" height="22" fill="#e7ca87" stroke="#503b31" strokeWidth="2" /><rect x="3" y="3" width="70" height="16" fill="#315a4f" /><text x="38" y="15" textAnchor="middle" fill="#fff0b2" fontFamily="FusionPixel, sans-serif" fontSize="9">佐佑公会</text></g>
          <GuildCrest symbol transform="translate(305 54) scale(.12)" />
          <g data-pixel-detail="lantern-pair"><rect x="278" y="120" width="6" height="10" fill="#49342d" /><rect x="280" y="122" width="2" height="6" fill="#ffd36d" className="window-flicker" /><rect x="346" y="120" width="6" height="10" fill="#49342d" /><rect x="348" y="122" width="2" height="6" fill="#ffd36d" className="window-flicker" /></g>
          <g data-pixel-detail="lodge-chimney"><rect x="354" y="55" width="14" height="32" fill="#765647" /><rect x="351" y="53" width="20" height="6" fill="#423733" /><rect x="358" y="48" width="5" height="4" fill="#d9d0b3" opacity=".45" /></g>
          <g data-pixel-detail="ivy-and-flower-boxes"><rect x="254" y="132" width="16" height="4" fill="#7d5538" /><rect x="258" y="129" width="3" height="3" fill="#ef8c78" /><rect x="265" y="128" width="3" height="3" fill="#f2cf70" /><rect x="358" y="132" width="17" height="4" fill="#7d5538" /><rect x="362" y="128" width="3" height="3" fill="#f0d276" /><rect x="369" y="129" width="3" height="3" fill="#e78789" /></g>
        </g>

        <g data-scene-layer="foreground-garden">
          <path d="M0 170 32 163l33 4 35-5 38 9 45-4 41 8 42-7 45 6 40-4 49 7v13H0z" fill="#2a664a" data-pixel-detail="foreground-grass" />
          <path d="m0 182 45-6 41 6 40-4 47 7 51-5 41 6 53-6 42 5 40-3v8H0z" fill="#163f38" data-pixel-detail="deep-foreground" />
          <g data-pixel-detail="flowering-foreground"><rect x="15" y="165" width="2" height="13" fill="#4d7745" /><rect x="11" y="163" width="10" height="5" fill="#f08c82" /><rect x="51" y="160" width="2" height="14" fill="#4d7745" /><rect x="47" y="158" width="10" height="5" fill="#f5d477" /><rect x="91" y="167" width="2" height="12" fill="#4d7745" /><rect x="87" y="164" width="10" height="5" fill="#d899c7" /><rect x="211" y="171" width="2" height="11" fill="#4d7745" /><rect x="207" y="168" width="10" height="5" fill="#f19777" /></g>
          <g transform="translate(220 139)" data-pixel-detail="wooden-waypost"><rect x="7" y="0" width="4" height="35" fill="#67452f" /><path d="M0 3h31v12H0z" fill="#b97843" stroke="#5f3f2d" strokeWidth="2" /><text x="15.5" y="11" textAnchor="middle" fill="#fff0b7" fontFamily="FusionPixel, sans-serif" fontSize="6">公会大厅</text></g>
        </g>

        <g data-scene-layer="forest-frame">
          <g data-pixel-detail="left-forest-silhouette"><path d="M0 0h28v12h12v15h-9v17h8v18H27v21H15v31H0z" fill="#173d39" /><path d="M0 19h18V8h13v15h-8v17h7v18H18v18H6z" fill="#2b654d" /><rect x="5" y="33" width="9" height="7" fill="#6f9655" /><rect x="16" y="16" width="9" height="7" fill="#789e56" /></g>
          <g data-pixel-detail="right-forest-silhouette"><path d="M400 0h-22v15h-13v17h8v16h-11v22h12v25h13v31h13z" fill="#173b38" /><path d="M400 22h-15V11h-12v15h7v18h-8v18h12v23h8z" fill="#2d654d" /><rect x="383" y="31" width="10" height="7" fill="#739755" /><rect x="370" y="18" width="9" height="7" fill="#82a75a" /></g>
          <g data-pixel-detail="near-pines"><PixelPine x={2} y={103} scale={1.35} tone="#173f3b" /><PixelPine x={25} y={119} scale={1.02} tone="#225c4a" /><PixelPine x={371} y={112} scale={1.18} tone="#173f3b" /></g>
          <g fill="#fff4ad" opacity=".76" data-pixel-detail="forest-fireflies"><rect x="19" y="112" width="2" height="2" /><rect x="35" y="139" width="1" height="1" /><rect x="381" y="104" width="2" height="2" /><rect x="367" y="142" width="1" height="1" /></g>
        </g>

        <g data-scene-layer="adventurer-party">
          {adventurers.map((adventurer, index) => <PixelAdventurer key={adventurer.name} {...adventurer} index={index} />)}
        </g>
      </svg>

      <div className="hero-atmosphere valley-atmosphere" data-atmosphere="cinematic-depth" aria-hidden="true">
        <i className="atmosphere-ray" /><i className="atmosphere-mist mist-left" /><i className="atmosphere-mist mist-right" />
        {Array.from({ length: 10 }, (_, index) => <span key={index} style={{ '--particle-index': index } as CSSProperties} data-atmosphere-particle />)}
      </div>
    </div>
  );
}
