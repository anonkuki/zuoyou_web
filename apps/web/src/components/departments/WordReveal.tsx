import { motion, useReducedMotion, type Variants } from 'framer-motion';

const container: Variants = { show: { transition: { staggerChildren: .055 } } };
const token: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: .5, ease: [0.22, 1, 0.36, 1] } },
};

/** 逐词/逐字显现标题：拉丁词保持整体，中日韩逐字。reduced-motion 下直接静态渲染。 */
export function WordReveal({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{text}</span>;
  const tokens = text.match(/[A-Za-z0-9]+|\s|\S/g) ?? [];
  return (
    <motion.span className={className} variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-6% 0px' }}>
      {tokens.map((part, index) => (
        <motion.span key={index} className="word-reveal-token" variants={token}>{/\s/.test(part) ? ' ' : part}</motion.span>
      ))}
    </motion.span>
  );
}
