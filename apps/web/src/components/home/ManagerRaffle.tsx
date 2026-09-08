import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isManagementRole } from '@guild/contracts';
import { RotateCcw, Sparkles, X } from 'lucide-react';
import { api, json } from '../../api';
import { useAuth } from '../../auth';
import './manager-raffle.css';

interface RafflePrize {
  id: string;
  tier: number;
  name: string;
  contents: string;
  initialStock: number;
  remainingStock: number;
  accent: string;
}

interface RaffleDraw {
  id: string;
  prizeId: string;
  prizeName: string;
  prizeContents: string;
  operatorId: string;
  operatorDisplayName: string;
  drawnAt: string;
}

interface RaffleState {
  prizes: RafflePrize[];
  totalInitial: number;
  totalRemaining: number;
  recentDraws: RaffleDraw[];
  canReset: boolean;
  draw?: RaffleDraw;
}

const raffleKey = ['manager-raffle'] as const;
const wait = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration));

function PixelGarapon({ rolling = false, compact = false }: { rolling?: boolean; compact?: boolean }) {
  return (
    <span className={`pixel-garapon ${rolling ? 'is-rolling' : ''} ${compact ? 'is-compact' : ''}`} aria-hidden="true">
      <span className="garapon-sign">福</span>
      <span className="garapon-drum"><i/><i/><i/></span>
      <span className="garapon-axle"/>
      <span className="garapon-crank"><i/></span>
      <span className="garapon-chute"><i/></span>
      <span className="garapon-base"/>
    </span>
  );
}

export function ManagerRaffle() {
  const { user } = useAuth();
  const client = useQueryClient();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<RaffleDraw | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const manager = Boolean(user && isManagementRole(user.role));
  const state = useQuery({ queryKey: raffleKey, queryFn: () => api<RaffleState>('/api/admin/raffle'), enabled: manager && open, staleTime: 5_000 });
  const draw = useMutation({
    mutationFn: async () => {
      const request = api<RaffleState>('/api/admin/raffle/draw', json('POST'));
      const [next] = await Promise.all([request, wait(reduceMotion ? 0 : 620)]);
      return next;
    },
    onMutate: () => { setResult(null); setConfirmReset(false); },
    onSuccess: (next) => {
      client.setQueryData(raffleKey, next);
      setResult(next.draw ?? null);
    },
  });
  const reset = useMutation({
    mutationFn: () => api<RaffleState>('/api/admin/raffle/reset', json('POST', { confirm: 'RESET_RAFFLE' })),
    onSuccess: (next) => {
      client.setQueryData(raffleKey, next);
      setResult(null);
      setConfirmReset(false);
    },
  });

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !draw.isPending) setOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [draw.isPending, open]);

  if (!manager) return null;
  const raffle = state.data;
  const empty = raffle?.totalRemaining === 0;

  return (
    <>
      <motion.button type="button" className="raffle-launcher" aria-label="现场抽奖" data-machine="pixel-garapon"
        onClick={() => setOpen(true)} whileHover={reduceMotion ? undefined : { y: -5, rotate: -1 }} whileTap={{ scale: .94 }}>
        <PixelGarapon compact />
        <span><strong>现场抽奖</strong><small>福引所 · 仅管理组</small></span>
        <i className="raffle-launcher-glint" aria-hidden="true"/>
      </motion.button>

      {createPortal(<AnimatePresence>
        {open && <motion.div className="raffle-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !draw.isPending) setOpen(false); }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.section className="raffle-dialog" role="dialog" aria-modal="true" aria-labelledby="raffle-title"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 34, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .97 }}>
            <header className="raffle-dialog-header">
              <div><small>SAIYUU FESTIVAL · GARAPON</small><h2 id="raffle-title">福引抽奖所</h2><p>转动手柄，彩球会替你选出今天的礼物。</p></div>
              <button type="button" aria-label="关闭抽奖" onClick={() => setOpen(false)} disabled={draw.isPending}><X /></button>
            </header>

            {state.isLoading ? <div className="raffle-loading">正在清点彩球…</div> : state.error ? <div className="raffle-error">{state.error.message}<button onClick={() => state.refetch()}>重新读取</button></div> : raffle && <div className="raffle-stage">
              <div className="raffle-machine-bay">
                <div className="raffle-lanterns" aria-hidden="true"><i/><i/><i/><i/><i/></div>
                <PixelGarapon rolling={draw.isPending} />
                <div className="raffle-stock-meter"><span>今日奖池</span><strong>剩余 {raffle.totalRemaining} / {raffle.totalInitial} 抽</strong><i><b style={{ width: `${raffle.totalInitial ? raffle.totalRemaining / raffle.totalInitial * 100 : 0}%` }}/></i></div>
                <button type="button" className="raffle-draw-button" aria-label="摇动手柄" onClick={() => draw.mutate()} disabled={draw.isPending || empty}>
                  <span>{draw.isPending ? '咔啦咔啦…' : empty ? '奖池已抽完' : '摇动手柄'}</span><small>{empty ? '感谢参与' : '每次抽取 1 份'}</small>
                </button>
                {draw.error && <p className="raffle-action-error">{draw.error.message}</p>}
              </div>

              <div className="raffle-info-panel">
                <AnimatePresence mode="wait">
                  {result ? <motion.div key={result.id} className={`raffle-result tier-${result.prizeId}`} role="status"
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: .72, rotate: -4 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}>
                    <Sparkles/><small>彩球落下来了！</small><strong>{result.prizeName}</strong><p>{result.prizeContents}</p><span>请工作人员现场核销奖品</span>
                  </motion.div> : <motion.div key="guide" className="raffle-guide" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <span className="raffle-ball-preview"><i/><i/><i/></span><strong>准备好了吗？</strong><p>库存会在抽中后自动扣减，多位工作人员同时操作也不会重复发奖。</p>
                  </motion.div>}
                </AnimatePresence>
                <div className="raffle-prize-list">
                  {raffle.prizes.slice().reverse().map((prize) => <article key={prize.id} style={{ '--prize-accent': prize.accent } as React.CSSProperties}>
                    <span>{prize.tier === 1 ? '金' : prize.tier === 2 ? '蓝' : '绿'}球</span><div><strong>{prize.name}</strong><p>{prize.contents}</p></div><b>{prize.remainingStock}<small> / {prize.initialStock}</small></b>
                  </article>)}
                </div>
                {raffle.recentDraws.length > 0 && <div className="raffle-history"><h3>最近开出</h3>{raffle.recentDraws.slice(0, 4).map((item) => <p key={item.id}><span>{item.prizeName}</span>{item.prizeContents}<small>{item.operatorDisplayName}</small></p>)}</div>}
                {raffle.canReset && <div className="raffle-reset-zone">
                  {confirmReset ? <><span>将清空本轮记录并恢复 300 份库存</span><button className="danger" onClick={() => reset.mutate()} disabled={reset.isPending}>{reset.isPending ? '正在复原…' : '确认重置'}</button><button onClick={() => setConfirmReset(false)}>取消</button></> : <button onClick={() => setConfirmReset(true)}><RotateCcw/>重置本轮奖池</button>}
                  {reset.error && <p>{reset.error.message}</p>}
                </div>}
              </div>
            </div>}
          </motion.section>
        </motion.div>}
      </AnimatePresence>, document.body)}
    </>
  );
}
