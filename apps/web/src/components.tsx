import { motion } from 'framer-motion';
import { LoaderCircle, ScrollText, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';

export function PageHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return (
    <header className="page-hero">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }}>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </motion.div>
    </header>
  );
}

export function LoadingPanel({ label = '正在翻阅公会档案' }: { label?: string }) {
  return <div className="state-panel"><LoaderCircle className="spin" aria-hidden="true" /><span>{label}</span></div>;
}

export function ErrorPanel({ error }: { error: unknown }) {
  return <div className="state-panel error"><ShieldAlert aria-hidden="true" /><span>{error instanceof Error ? error.message : '档案读取失败'}</span></div>;
}

export function EmptyPanel({ label = '这里暂时没有记录' }: { label?: string }) {
  return <div className="state-panel"><ScrollText aria-hidden="true" /><span>{label}</span></div>;
}

const statusLabels: Record<string, string> = {
  PREPARING: '筹备中', REGISTRATION: '报名中', IN_PROGRESS: '进行中', ENDED: '已结束', ARCHIVED: '已归档',
  PENDING: '待审核', APPROVED: '已通过', REJECTED: '已拒绝', PUBLISHED: '已发布',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{statusLabels[status] ?? status}</span>;
}

export function RuneIcon({ children }: { children: ReactNode }) {
  return <span className="rune-icon" aria-hidden="true">{children}</span>;
}

export function formatDate(value?: string | null) {
  if (!value) return '待定';
  return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
