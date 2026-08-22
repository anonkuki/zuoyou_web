import type { CSSProperties, ReactNode } from 'react';

/** 8-bit 阶梯像素粗边框容器（无圆角，box-shadow 逐像素描边） */
export function PixelFrame({ children, className = '', color }: { children: ReactNode; className?: string; color?: string }) {
  return <div className={`pixel-frame ${className}`} style={color ? ({ '--pixel-frame-color': color } as CSSProperties) : undefined}>{children}</div>;
}

/** 8-bit 锯齿章节分割线 */
export function PixelDivider({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return <div className={`pixel-divider${flip ? ' is-flip' : ''} ${className}`} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>;
}

const spriteSrc: Record<string, string> = {
  publicity: '/assets/character/adventurers/guild-steward.png',
  tech: '/assets/character/adventurers/silver-ranger.png',
  original: '/assets/character/adventurers/green-mage.png',
  dance: '/assets/character/adventurers/rose-adventurer.png',
  cos: '/assets/brand/youzi-mascot.png',
  music: '/assets/character/adventurers/green-mage.png',
};

const spriteLabel: Record<string, string> = {
  publicity: '外宣&幻想研像素接待员',
  tech: '技术部像素游侠',
  original: '原创部像素画师',
  dance: '舞装部像素舞者',
  cos: 'COS部看板娘佑子',
  music: '轻音部像素乐手',
};

/** 部门像素 sprite 吉祥物：steps() 逐帧待机浮动，image-rendering: pixelated */
export function PixelSprite({ slug, className = '' }: { slug: string; className?: string }) {
  const src = spriteSrc[slug] ?? spriteSrc.publicity;
  return (
    <span className={`pixel-sprite sprite-${slug} ${className}`} role="img" aria-label={spriteLabel[slug] ?? '部门像素吉祥物'}>
      <img src={src} alt="" aria-hidden="true" draggable={false} loading="lazy" decoding="async" />
    </span>
  );
}
