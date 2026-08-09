import { useRef, type CSSProperties } from 'react';
import { GuildCrest } from './GuildCrest';
import { GuildAtmosphereCanvas } from './GuildAtmosphereCanvas';
import { useGuildSceneParallax } from './useGuildSceneParallax';

const SCENE_ROOT = '/assets/background/golden-valley';
const ARCH_ROOT = '/assets/architecture/guild';
const CHARACTER_ROOT = '/assets/character/adventurers';

const parallaxLayers = [
  { role: 'clouds', file: 'clouds.png', className: 'open-layer clouds-layer', license: 'CC0 · Loota' },
  { role: 'sunlit-mountains', file: 'sunlit-mountains.png', className: 'open-layer sunlit-mountains-layer', license: 'CC0 · ansimuz' },
  { role: 'castle-silhouette', file: 'castle.png', className: 'open-layer castle-layer', license: 'CC0 · Loota' },
  { role: 'far-forest', file: 'forest-far.png', className: 'open-layer forest-layer forest-far', license: 'CC0 · Loota' },
  { role: 'mid-forest', file: 'forest-mid-a.png', className: 'open-layer forest-layer forest-mid-a', license: 'CC0 · Loota' },
  { role: 'mid-forest-secondary', file: 'forest-mid-b.png', className: 'open-layer forest-layer forest-mid-b', license: 'CC0 · Loota' },
  { role: 'near-forest', file: 'forest-near-a.png', className: 'open-layer forest-layer forest-near-a', license: 'CC0 · Loota' },
  { role: 'near-forest-secondary', file: 'forest-near-b.png', className: 'open-layer forest-layer forest-near-b', license: 'CC0 · Loota' },
] as const;

const adventurers = [
  { file: 'rose-adventurer.png', name: '红发冒险者', className: 'party-member party-rose' },
  { file: 'guild-steward.png', name: '公会执事', className: 'party-member party-steward' },
  { file: 'green-mage.png', name: '绿发精灵法师', className: 'party-member party-mage' },
  { file: 'silver-ranger.png', name: '银发游侠', className: 'party-member party-ranger' },
] as const;

const departmentProps = [
  { name: 'COS部服装箱', short: 'COS', className: 'culture-costume' },
  { name: '技术部像素终端', short: 'TECH', className: 'culture-terminal' },
  { name: '轻音部乐器箱', short: 'MUSIC', className: 'culture-music' },
  { name: '原创部画板', short: 'ART', className: 'culture-art' },
  { name: '舞装部折扇', short: 'DANCE', className: 'culture-dance' },
  { name: '外宣部相机', short: 'MEDIA', className: 'culture-camera' },
] as const;

function ArchitectureImage({ file, className, piece = true }: { file: string; className: string; piece?: true | string }) {
  return <img src={`${ARCH_ROOT}/${file}`} className={className} alt="" aria-hidden="true" draggable={false} data-architecture-piece={piece} />;
}

function GuildBuilding() {
  return (
    <div className="guild-building-art" data-open-asset-layer="guild-architecture" data-license="CC-BY-3.0 · Keith Karnage">
      <span className="lodge-cast-shadow" />
      <ArchitectureImage file="guild-lodge-cutout.png" className="guild-lodge-cutout" piece="cohesive-lodge" />

      <div className="lodge-banner" data-architecture-piece><GuildCrest /></div>
      <div className="lodge-sign" data-architecture-piece>
        <ArchitectureImage file="blank-sign.png" className="lodge-sign-board" />
        <span>公会大厅</span>
      </div>
      <i className="lodge-lantern lantern-left" data-architecture-piece /><i className="lodge-lantern lantern-right" data-architecture-piece />
      <span className="lodge-step step-one" /><span className="lodge-step step-two" /><span className="lodge-step step-three" />
    </div>
  );
}

export function LuminousGuildScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  useGuildSceneParallax(sceneRef);

  return (
    <div
      ref={sceneRef}
      className="layered-guild-scene luminous-valley-scene"
      data-testid="layered-guild-scene"
      data-layout="cinematic-wide"
      aria-label="分层像素幻想公会大厅场景"
    >
      <div className="scene-sky-paint" aria-hidden="true" />
      <div className="pixel-sun" data-lighting="golden-hour" aria-hidden="true"><i /><b /></div>

      {parallaxLayers.map((layer) => (
        <img
          key={layer.role}
          src={`${SCENE_ROOT}/${layer.file}`}
          className={layer.className}
          data-open-asset-layer={layer.role}
          data-license={layer.license}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      ))}

      <div className="valley-floor" aria-hidden="true"><i /><b /><em /></div>
      <div className="guild-approach" data-environment="guild-approach" aria-hidden="true">
        <span className="approach-shadow" />
        {Array.from({ length: 14 }, (_, index) => {
          const row = Math.floor(index / 2);
          const side = index % 2 ? 1 : -1;
          return <i key={index} style={{ '--stone-left': `${50 + side * (9 + row * 3.6)}%`, '--stone-top': `${row * 12}%`, '--stone-width': `${36 + row * 5}px` } as CSSProperties} />;
        })}
        <b className="approach-grass grass-a" /><b className="approach-grass grass-b" />
      </div>
      <img className="scene-tree tree-left" src={`${SCENE_ROOT}/tree-left.png`} alt="" aria-hidden="true" draggable={false} />
      <img className="scene-tree tree-right" src={`${SCENE_ROOT}/tree-right.png`} alt="" aria-hidden="true" draggable={false} />
      <GuildAtmosphereCanvas />
      <GuildBuilding />

      <div className="anime-culture-props" data-anime-culture="six-departments" aria-label="六部门文化陈列">
        <div className="culture-stall creative-stall"><strong>创作工坊</strong>{departmentProps.slice(0, 3).map((prop) => (
          <span className={`culture-prop ${prop.className}`} data-department-prop aria-label={prop.name} role="img" key={prop.name}>
            <i /><b /><em /><small>{prop.short}</small>
          </span>
        ))}</div>
        <div className="culture-stall stage-stall"><strong>舞台仓库</strong>{departmentProps.slice(3).map((prop) => (
          <span className={`culture-prop ${prop.className}`} data-department-prop aria-label={prop.name} role="img" key={prop.name}>
            <i /><b /><em /><small>{prop.short}</small>
          </span>
        ))}</div>
      </div>

      <div className="licensed-party" data-open-asset-layer="adventurer-party" data-license="CC0 · Eldiran" data-facing="visitor">
        {adventurers.map((adventurer) => (
          <img key={adventurer.name} src={`${CHARACTER_ROOT}/${adventurer.file}`} className={adventurer.className} alt={adventurer.name} draggable={false} />
        ))}
        <span className="party-welcome">欢迎来到佐佑！</span>
      </div>

      <div className="hero-atmosphere valley-atmosphere" data-atmosphere="cinematic-depth" aria-hidden="true">
        <i className="atmosphere-ray ray-one" /><i className="atmosphere-ray ray-two" />
        <i className="atmosphere-mist mist-left" /><i className="atmosphere-mist mist-right" />
        {Array.from({ length: 10 }, (_, index) => <span key={index} style={{ '--particle-index': index } as CSSProperties} data-atmosphere-particle />)}
      </div>
      <span className="scene-vignette" aria-hidden="true" />
    </div>
  );
}
