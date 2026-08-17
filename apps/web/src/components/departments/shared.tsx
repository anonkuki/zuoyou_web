import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { deptMotion, stepsEase } from './showcase-data';
import { WordReveal } from './WordReveal';

/** hero 多层视差：远景慢、近景快、文案最慢上浮 */
export function useHeroParallax(ref: RefObject<HTMLElement | null>) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 22 });
  const farY = useTransform(smooth, [0, 1], ['0%', '22%']);
  const nearY = useTransform(smooth, [0, 1], ['0%', '-14%']);
  const copyY = useTransform(smooth, [0, 1], ['0%', '34%']);
  const fade = useTransform(smooth, [0, 0.75], [1, 0]);
  const layer = <T,>(value: MotionValue<T>) => (reduce ? undefined : value);
  return { reduce, far: layer(farY), near: layer(nearY), copy: layer(copyY), fade: layer(fade) };
}

/** 章节头（像素序号 + 逐词标题 + 英文小标） */
export function SectionHead({ no, zh, en, note }: { no: string; zh: string; en: string; note?: string }) {
  return (
    <header className="dept-section-head">
      <span className="dept-section-no">{no}</span>
      <h2><WordReveal text={zh} /> <em>{en}</em></h2>
      {note ? <p>{note}</p> : null}
    </header>
  );
}

/** 右侧固定像素章节轨：滚动高亮当前章节，点击平滑锚点跳转（移动端隐藏） */
export function ChapterRail({ items }: { items: { id: string; no: string; label: string }[] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(items[0]?.id ?? '');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: '-38% 0px -55% 0px' });
    for (const { id } of items) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  return (
    <nav className="chapter-rail" aria-label="章节导航">
      {items.map(item => (
        <button key={item.id} type="button" className={active === item.id ? 'is-active' : ''} onClick={() => jump(item.id)} aria-label={`跳转到${item.label}`} aria-current={active === item.id ? 'true' : undefined}>
          <b>{item.no}</b><span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

/** 每部门入场语法对应的 motion props（供 motion.article / motion.figure 等元素直接展开） */
export function entranceProps(slug: string, index = 0) {
  const token = deptMotion[slug] ?? deptMotion.music;
  const delay = index * token.stagger;
  const viewport = { once: true, margin: '-8% 0px' } as const;
  switch (token.kind) {
    case 'steps':
      return { initial: { opacity: 0, y: 22 }, whileInView: { opacity: 1, y: 0 }, viewport, transition: { duration: token.duration, delay, ease: stepsEase(4) } };
    case 'shutter':
      return { initial: { opacity: 0, clipPath: 'inset(50% 0 50% 0)' }, whileInView: { opacity: 1, clipPath: 'inset(0% 0 0% 0)' }, viewport, transition: { duration: token.duration, delay, ease: token.ease } };
    case 'spring':
      return { initial: { opacity: 0, y: 38, scale: .93 }, whileInView: { opacity: 1, y: 0, scale: 1 }, viewport, transition: { type: 'spring', stiffness: 250, damping: 14, delay } as const };
    case 'beat':
      return { initial: { opacity: 0, y: 44, skewX: index % 2 ? -6 : 6, scale: 1 }, whileInView: { opacity: 1, y: [44, -9, 0], skewX: 0, scale: [1, 1.045, 1] }, viewport, transition: { duration: token.duration, delay, times: [0, 0.68, 1], ease: token.ease } };
    case 'dissolve':
      return { initial: { opacity: 0, clipPath: 'circle(0% at 50% 42%)', filter: 'blur(6px)' }, whileInView: { opacity: 1, clipPath: 'circle(120% at 50% 42%)', filter: 'blur(0px)' }, viewport, transition: { duration: token.duration, delay, ease: token.ease } };
    default:
      return { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport, transition: { duration: token.duration, delay, ease: token.ease } };
  }
}

/**
 * 每部门独立入场语法：
 * publicity 逐帧跳进 / tech 快门开合 / original 回弹 spring / dance 节拍预备弹跳+skew / cos 圆形擦除溶解 / music 流动长缓动
 */
export function DeptReveal({ slug, index = 0, className = '', children }: { slug: string; index?: number; className?: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return <motion.div className={className} {...entranceProps(slug, index)}>{children}</motion.div>;
}
