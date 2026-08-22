import { useEffect, useState } from 'react';
import { resolveAvatarConfig, type AvatarConfig } from '@guild/contracts';
import { buildAvatarRuns } from './avatar-parts';

interface PixelAvatarProps {
  config?: AvatarConfig | null;
  /** 无配置时按该种子（用户 id）派生稳定默认形象 */
  seed?: string;
  /** 行走两帧动画 */
  moving?: boolean;
  /** 朝向：left 时水平翻转 */
  dir?: 'left' | 'right' | 'down' | 'up' | string;
  size?: number;
  className?: string;
  label?: string;
}

/** 参数化像素小人：纯 SVG 网格渲染，crispEdges 保持 8-bit 锐利边缘 */
export function PixelAvatar({ config, seed = 'guild', moving = false, dir = 'down', size = 64, className = '', label = '像素小人' }: PixelAvatarProps) {
  const [frame, setFrame] = useState<0 | 1>(0);
  useEffect(() => {
    if (!moving) {
      setFrame(0);
      return;
    }
    const timer = window.setInterval(() => setFrame((value) => (value === 0 ? 1 : 0)), 220);
    return () => window.clearInterval(timer);
  }, [moving]);
  const resolved = config ?? resolveAvatarConfig(seed, null);
  const runs = buildAvatarRuns(resolved, frame);
  return (
    <svg
      viewBox="0 0 24 28"
      width={size}
      height={(size * 28) / 24}
      className={`pixel-avatar ${className}`}
      data-dir={dir}
      data-moving={moving || undefined}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
    >
      {runs.map((part, index) => (
        <rect key={index} x={part.x} y={part.y} width={part.w} height={part.h} fill={part.fill} fillOpacity={part.o} />
      ))}
    </svg>
  );
}
