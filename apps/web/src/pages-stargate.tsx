import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'framer-motion';
import { Lock, LockOpen, RadioTower, ShieldAlert, TriangleAlert } from 'lucide-react';
import { isExecutiveRole } from '@guild/contracts';
import { api, json } from './api';
import { useAuth } from './auth';
import { matchStargateSubject, padStargateSeq, stargateDoctor, stargateSubjects, type StargateSubject } from './stargate-data';
import './stargate.css';

const PROGRESS_KEY = 'sg_event_progress_v1';
const RECORD_KEY = 'sg_event_record_v1';
const COMPLETION_TEXT = '信息已收录，星门权限已开启';

interface StargateRecord { name: string; seq: number; createdAt: string }
interface AgentRecord { name: string; seq: number }
interface LogItem { name: string; seq: number }

function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

/** 顶部 HUD 里一直走的时间码，让画面保持“正在记录”的呼吸感 */
function TickingTimecode() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setFrame((value) => value + 1), 100);
    return () => window.clearInterval(timer);
  }, []);
  const totalFrames = frame % (24 * 60 * 60);
  const hh = String(Math.floor(totalFrames / 86400)).padStart(2, '0');
  const mm = String(Math.floor((totalFrames % 86400) / 1440)).padStart(2, '0');
  const ss = String(Math.floor((totalFrames % 1440) / 24)).padStart(2, '0');
  const ff = String(totalFrames % 24).padStart(2, '0');
  return <span className="sg-tc">TC {hh}:{mm}:{ss}:{ff}</span>;
}

/** 三排交错排布：上二、中三、下二，中央档案固定在视觉中心 */
const wallLayout: Array<{ area: string; rot: string; shift: string }> = [
  { area: 'a', rot: '-1.2deg', shift: 'translate(0, 0)' },
  { area: 'b', rot: '1deg', shift: 'translate(0, 0)' },
  { area: 'c', rot: '0.8deg', shift: 'translate(0, 0)' },
  { area: 'd', rot: '-0.9deg', shift: 'translate(0, 0)' },
  { area: 'e', rot: '1deg', shift: 'translate(0, 0)' },
  { area: 'f', rot: '-0.8deg', shift: 'translate(0, 0)' },
];

interface SubjectCardProps {
  subject: StargateSubject;
  solved: boolean;
  onSolved: (id: string) => void;
  index: number;
  reduce: boolean;
}

/** 主体影像卡：辨识输入直接嵌在卡片原本 UNIDENTIFIED 的位置 */
function SubjectCard({ subject, solved, onSolved, index, reduce }: SubjectCardProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [scope, animate] = useAnimate();
  const layout = wallLayout[index];

  const verify = () => {
    const input = value.trim();
    if (!input || solved) return;
    if (matchStargateSubject(input, subject)) {
      setError(false);
      onSolved(subject.id);
    } else {
      setError(true);
      if (!reduce && scope.current) animate(scope.current, { x: [0, -7, 7, -5, 5, -2, 0] }, { duration: 0.4 });
    }
  };

  return (
    <motion.figure
      ref={scope}
      className={`sg-photo ${solved ? 'solved' : ''}`}
      style={{ gridArea: layout.area, '--sg-rot': layout.rot, '--sg-shift': layout.shift } as React.CSSProperties}
      initial={reduce ? false : { opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="sg-photo-frame">
        <div className="sg-photo-media">
          <img src={subject.image} alt={solved ? `${subject.displayName} 的回收影像` : `未辨识主体 ${subject.no} 的失真影像`} loading="lazy" draggable={false} />
          <span className="sg-photo-static" aria-hidden="true" />
          <span className="sg-photo-sweep" aria-hidden="true" />
          <span className="sg-photo-id" aria-hidden="true">SUBJECT://{subject.no}</span>
          <span className="sg-photo-file" aria-hidden="true">{subject.meta.file}</span>
          <span className="sg-photo-transcript" aria-hidden="true">“{subject.transcript}”</span>
          <AnimatePresence>
            {solved && (
              <motion.span
                className="sg-photo-stamp"
                initial={reduce ? false : { scale: 1.9, opacity: 0, rotate: -18 }}
                animate={{ scale: 1, opacity: 1, rotate: -8 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              >
                IDENTIFIED
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <figcaption className="sg-card-caption">
          {solved ? (
            <motion.div
              className="sg-card-name"
              initial={reduce ? false : { opacity: 0, y: 12, filter: 'blur(7px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.32, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <strong>{subject.displayName}</strong>
              <small>{subject.englishName}</small>
            </motion.div>
          ) : (
            <div className={`sg-card-input ${error ? 'error' : ''}`}>
              <input
                value={value}
                maxLength={24}
                autoComplete="off"
                placeholder="输入 TA 的真实姓名…"
                aria-label={`辨识 SUBJECT://${subject.no} 的真实姓名`}
                aria-invalid={error}
                onChange={(event) => { setValue(event.target.value); if (error) setError(false); }}
                onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); verify(); } }}
                onBlur={verify}
              />
              {error && (
                <p className="sg-error-line" role="alert">
                  <TriangleAlert aria-hidden="true" /> 身份不符 · 请重试
                </p>
              )}
            </div>
          )}
        </figcaption>
      </div>
    </motion.figure>
  );
}

/** 中央卡片底部的解密者名录：留名自动浮现、逐条切换 */
function RecordsCycle({ items, mineSeq, reduce, emptyText }: { items: LogItem[]; mineSeq?: number; reduce: boolean; emptyText: string }) {
  const [index, setIndex] = useState(0);
  const count = items.length;

  useEffect(() => {
    if (count < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % count), 3400);
    return () => window.clearInterval(timer);
  }, [count]);

  useEffect(() => { if (index >= count) setIndex(0); }, [count, index]);

  if (!count) return <p className="sg-log-empty">{emptyText}</p>;
  const item = items[Math.min(index, count - 1)];
  return (
    <div className="sg-log-cycle">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={`${item.seq}-${item.name}`}
          className={item.seq === mineSeq ? 'mine' : ''}
          initial={reduce ? false : { opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={reduce ? undefined : { opacity: 0, y: -16, filter: 'blur(6px)' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {item.name}<em>{padStargateSeq(item.seq)}</em>
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function CompletionOverlay({ record, onClose, reduce }: { record: AgentRecord; onClose: () => void; reduce: boolean }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="sg-completion"
      role="dialog"
      aria-modal="true"
      aria-label="星门权限已开启"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="sg-completion-scan" aria-hidden="true" />
      <motion.div
        className="sg-completion-card"
        initial={reduce ? false : { scale: 0.9, y: 26 }}
        animate={{ scale: 1, y: 0 }}
        exit={reduce ? undefined : { scale: 0.94, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 170, damping: 20 }}
      >
        <motion.span className="sg-completion-eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <RadioTower aria-hidden="true" /> INFORMATION RECORDED
        </motion.span>
        <h2 className="sg-completion-title" aria-label={COMPLETION_TEXT}>
          {COMPLETION_TEXT.split('').map((ch, index) => (
            <motion.span
              key={index}
              aria-hidden="true"
              initial={reduce ? false : { opacity: 0, y: 12, filter: 'blur(7px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.35 + index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {ch === ' ' ? '\u00a0' : ch}
            </motion.span>
          ))}
        </h2>
        <motion.p className="sg-completion-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
          STARGATE ACCESS GRANTED
        </motion.p>
        <motion.div className="sg-completion-record" initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}>
          <small>RECORDED AGENT · 解密者档案</small>
          <strong>{record.name}<em>{padStargateSeq(record.seq)}</em></strong>
        </motion.div>
        <motion.div className="sg-completion-video" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.1 }}>
          <span className="sg-video-pulse" aria-hidden="true" />
          {/* 星门下行影像就绪后，在此处替换为视频播放区块 */}
          <p>影像传输通道已建立 · 下行信号解析中……</p>
        </motion.div>
        <motion.button type="button" className="sg-completion-close" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
          返回巡游现场
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export function StargateEventPage() {
  const reduce = useReducedMotion();
  const { user } = useAuth();
  const canPreview = Boolean(user && isExecutiveRole(user.role));
  const [solved, setSolved] = useState<Record<string, boolean>>(() => readStorage<Record<string, boolean>>(PROGRESS_KEY) ?? {});
  const [record, setRecord] = useState<AgentRecord | null>(() => readStorage<AgentRecord>(RECORD_KEY));
  const [showCompletion, setShowCompletion] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [unlockBurst, setUnlockBurst] = useState(false);
  const [preview, setPreview] = useState(false);
  const doctorRef = useRef<HTMLDivElement>(null);
  const agentInputRef = useRef<HTMLInputElement>(null);

  const solvedCount = stargateSubjects.filter((subject) => solved[subject.id]).length;

  // 社长层级测试模式：仅本机预览“全部辨识 + 留名浮现”的最终效果，不写入任何进度
  const previewName = (user?.displayName ?? '演示解密者').slice(0, 16);
  const previewRecord: AgentRecord = { name: previewName, seq: 7 };
  const previewItems: LogItem[] = [
    previewRecord,
    { name: '苍', seq: 6 },
    { name: '梅洛', seq: 5 },
    { name: '汀克', seq: 4 },
    { name: '白羽', seq: 3 },
    { name: '珂洛', seq: 2 },
    { name: '阿夜', seq: 1 },
  ];

  const isSolved = (id: string) => preview || Boolean(solved[id]);
  const allSolved = preview || solvedCount === stargateSubjects.length;
  const unlocked = allSolved;
  const activeRecord = preview ? previewRecord : record;

  useEffect(() => { localStorage.setItem(PROGRESS_KEY, JSON.stringify(solved)); }, [solved]);

  const records = useQuery({
    queryKey: ['stargate-records'],
    queryFn: () => api<{ items: StargateRecord[]; total: number }>('/api/public/stargate/records?limit=30'),
    refetchInterval: 30_000,
  });

  const submitAgent = useMutation({
    mutationFn: (name: string) => api<{ record: { id: string; name: string; seq: number; createdAt: string } }>('/api/public/stargate/records', json('POST', { name })),
    onSuccess: (data) => {
      const next = { name: data.record.name, seq: data.record.seq };
      setRecord(next);
      localStorage.setItem(RECORD_KEY, JSON.stringify(next));
      setShowCompletion(true);
      records.refetch();
    },
  });

  const markSolved = (id: string) => setSolved((current) => ({ ...current, [id]: true }));

  // 六位主体全部辨识成功时：中央档案闪光解锁，并把视线带回相墙中心
  useEffect(() => {
    if (!allSolved) return;
    setUnlockBurst(true);
    const hideTimer = window.setTimeout(() => setUnlockBurst(false), 1400);
    if (!preview) {
      doctorRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      if (!record) {
        const focusTimer = window.setTimeout(() => agentInputRef.current?.focus(), 1100);
        return () => { window.clearTimeout(hideTimer); window.clearTimeout(focusTimer); };
      }
    }
    return () => window.clearTimeout(hideTimer);
  }, [allSolved]);

  // 打开测试模式：先看六张卡片的名字浮现，再进入完成覆层
  useEffect(() => {
    if (!preview) return;
    doctorRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    const overlayTimer = window.setTimeout(() => setShowCompletion(true), 2200);
    return () => window.clearTimeout(overlayTimer);
  }, [preview]);

  const togglePreview = () => {
    if (!preview) setPreview(true);
    else { setPreview(false); setShowCompletion(false); }
  };

  const resetProgress = () => {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(RECORD_KEY);
    setSolved({});
    setRecord(null);
    setShowCompletion(false);
    setAgentName('');
    setPreview(false);
  };

  const logItems: LogItem[] = preview ? previewItems : (records.data?.items ?? []).map((item) => ({ name: item.name, seq: item.seq }));
  const logTotal = preview
    ? `测试预览 · 样本名录`
    : records.data ? `${records.data.total} 位穿越者已留名` : '正在读取名录……';

  return (
    <main className="stargate-event">
      <div className="sg-fx" aria-hidden="true">
        <span className="sg-fx-scanlines" />
        <span className="sg-fx-scanband" />
        <span className="sg-fx-grain" />
        <span className="sg-fx-tear tear-a" />
        <span className="sg-fx-tear tear-b" />
        <span className="sg-fx-vignette" />
      </div>

      <header className="sg-hero shell">
        <div className="sg-hero-hud">
          <span className="sg-rec"><i aria-hidden="true" />REC</span>
          <span>SAME FIELD LOG · RESTRICTED</span>
          <span className="sg-hero-hud-right">
            <TickingTimecode />
            <span>DEPTH -35m T -62C</span>
            {preview && <span className="sg-test-badge">TEST PREVIEW</span>}
          </span>
        </div>
        <motion.p className="sg-eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          SAYUU GUILD · SPECIAL OPERATION
        </motion.p>
        <motion.h1
          className="sg-title"
          data-text="迷途者的异界巡游"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          迷途者的异界巡游
        </motion.h1>
        <motion.p className="sg-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          THE LOST ONES&apos; INTERWORLD TOUR
        </motion.p>
        <motion.p className="sg-lore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          随着萨米星门的开启，泰拉诸国组建了探险队踏入星门去探索亚空间的秘密，然而星门的不稳定性将进入其中的探险队带到了一个与泰拉截然不同的空间，在这个空间内似乎还有六位来自不同世界的「伙伴？」。坍缩与机遇并存，带有安玛庇佑的探险手册将带领探险队脱离险境，携带空间的秘宝，寻找临界点返回泰拉。
        </motion.p>
        <motion.ol className="sg-brief" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }}>
          <li><b>01</b>观看现场回收的六段主体影像</li>
          <li><b>02</b>在每张影像卡下方输入六位「伙伴？」的真实姓名</li>
          <li><b>03</b>全部辨识后，在中央档案录入你的解密者代号</li>
        </motion.ol>
      </header>

      <section className="sg-wall shell" aria-label="回收影像墙">
        <header className="sg-wall-head">
          <span className="sg-eyebrow">RECOVERED FEEDS · 回收影像墙</span>
          <span className={`sg-wall-progress ${allSolved ? 'ok' : ''}`} aria-live="polite">
            IDENTIFIED <b>{preview ? 6 : solvedCount}</b>/6
          </span>
        </header>
        <div className="sg-wall-grid" key={preview ? 'preview' : 'live'}>
          {stargateSubjects.map((subject, index) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              solved={isSolved(subject.id)}
              onSolved={markSolved}
              index={index}
              reduce={Boolean(reduce)}
            />
          ))}

          <div className="sg-doctor-anchor" ref={doctorRef}>
            <motion.figure
              className={`sg-photo sg-doctor ${unlocked ? 'unlocked' : ''} ${activeRecord ? 'recorded' : ''}`}
              style={{ '--sg-rot': '0deg', '--sg-shift': 'translate(0, 0)' } as React.CSSProperties}
              initial={reduce ? false : { opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="sg-photo-frame">
                <div className="sg-photo-media">
                  <img src={stargateDoctor.image} alt={activeRecord ? `${activeRecord.name} 的解密者影像` : '解密者主体的失真影像'} loading="lazy" draggable={false} />
                  <span className="sg-photo-static" aria-hidden="true" />
                  <span className="sg-photo-sweep" aria-hidden="true" />
                  <span className="sg-photo-id" aria-hidden="true">SUBJECT://00</span>
                  <span className="sg-photo-file" aria-hidden="true">{stargateDoctor.meta.file}</span>
                  <span className="sg-photo-transcript" aria-hidden="true">“{stargateDoctor.transcript}”</span>
                  <AnimatePresence>
                    {unlocked && (
                      <motion.span
                        className="sg-photo-stamp doctor"
                        initial={reduce ? false : { scale: 1.9, opacity: 0, rotate: 10 }}
                        animate={{ scale: 1, opacity: 1, rotate: 6 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                      >
                        OPENED
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {unlockBurst && (
                      <motion.span
                        className="sg-unlock-burst"
                        initial={{ opacity: 0.85, scale: 0.55 }}
                        animate={{ opacity: 0, scale: 1.75 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.3, ease: 'easeOut' }}
                      />
                    )}
                  </AnimatePresence>
                </div>
                <figcaption className="sg-card-caption sg-doc-caption">
                  <div className="sg-doc-state">
                    {!unlocked ? (
                      <div className="sg-doctor-locked">
                        <span className="sg-doctor-locked-head">
                          <Lock aria-hidden="true" />AWAITING AUTHORIZATION
                        </span>
                        <span className="sg-doctor-progress" aria-live="polite">
                          <i>{solvedCount}/6</i>
                          <b>{Array.from({ length: stargateSubjects.length }, (_, index) => (
                            <em key={index} className={index < solvedCount ? 'on' : ''} />
                          ))}</b>
                        </span>
                        <small>辨识全部主体后，此处开放解密者代号录入</small>
                      </div>
                    ) : activeRecord ? (
                      <motion.div className="sg-doctor-record" initial={{ opacity: 0, y: 8, filter: 'blur(5px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.4, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
                        <small><LockOpen aria-hidden="true" /> RECORDED AGENT</small>
                        <strong>{activeRecord.name}<em>{padStargateSeq(activeRecord.seq)}</em></strong>
                      </motion.div>
                    ) : (
                      <motion.form
                        className="sg-doctor-form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        onSubmit={(event) => {
                          event.preventDefault();
                          const name = agentName.trim();
                          if (name && !submitAgent.isPending) submitAgent.mutate(name);
                        }}
                      >
                        <label htmlFor="sg-agent-name">解密者代号</label>
                        <input
                          id="sg-agent-name"
                          ref={agentInputRef}
                          value={agentName}
                          maxLength={16}
                          autoComplete="off"
                          placeholder="输入你的代号……"
                          onChange={(event) => setAgentName(event.target.value)}
                        />
                        <button type="submit" disabled={!agentName.trim() || submitAgent.isPending}>
                          {submitAgent.isPending ? '收录中…' : '确认收录'}
                        </button>
                        {submitAgent.error && (
                          <p className="sg-error-line" role="alert">
                            <ShieldAlert aria-hidden="true" /> {submitAgent.error.message}
                          </p>
                        )}
                      </motion.form>
                    )}
                  </div>
                  <div className="sg-doc-log">
                    <span className="sg-log-head">
                      <span className="sg-rec live"><i aria-hidden="true" />LIVE</span>
                      <b>{logTotal}</b>
                    </span>
                    <RecordsCycle items={logItems} mineSeq={activeRecord?.seq} reduce={Boolean(reduce)} emptyText="等待第一位穿越者留名 ……" />
                  </div>
                </figcaption>
              </div>
            </motion.figure>
          </div>
        </div>
      </section>

      <footer className="sg-footer shell">
        <p>本页面为「佐佑动漫社」限时特别行动 · 迷途者的异界巡游</p>
        <span className="sg-footer-actions">
          {canPreview && (
            <button type="button" className={`sg-preview-btn ${preview ? 'on' : ''}`} aria-pressed={preview} onClick={togglePreview}>
              {preview ? '退出测试预览' : '测试预览·完成效果'}
            </button>
          )}
          <button type="button" className="sg-reset" onClick={resetProgress}>清除本机进度（共用设备时使用）</button>
        </span>
      </footer>

      <AnimatePresence>
        {showCompletion && activeRecord && (
          <CompletionOverlay record={activeRecord} onClose={() => setShowCompletion(false)} reduce={Boolean(reduce)} />
        )}
      </AnimatePresence>
    </main>
  );
}
