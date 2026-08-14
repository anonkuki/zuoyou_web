import { ChevronRight, RotateCcw, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export type SceneSpeaker = {
  name: string;
  role: string;
  line: string;
  portrait?: string;
};

const guidePages = [
  {
    text: '我是看板娘佑子。第一次来佐佑的话，就从大厅慢慢逛起吧。',
    action: { to: '/chronicle', label: '先听听我们的故事' },
  },
  {
    text: '六个部门都在楼下摆好了介绍牌，看看哪一处最合你的兴趣。',
    action: { to: '/departments', label: '看看六个部门' },
  },
  {
    text: '如果已经想好了，也可以把申请交到柜台。我们会认真读完每一份介绍。',
    action: { to: '/join', label: '前往加入页面' },
  },
] as const;

export function MascotGuide({ speaker, onClearSpeaker }: { speaker?: SceneSpeaker | null; onClearSpeaker?: () => void }) {
  const [open, setOpen] = useState(true);
  const [page, setPage] = useState(0);
  const guide = guidePages[page];
  const active = speaker ?? { name: '佑子', role: '佐佑动漫社 · 看板娘', line: guide.text, portrait: '/assets/brand/youzi-mascot.png' };

  const returnToGuide = () => {
    onClearSpeaker?.();
    setPage(0);
  };

  return <div className="mascot-guide-slot">
    <AnimatePresence mode="wait">
      {open ? <motion.aside
        key={speaker ? `speaker-${speaker.name}` : `guide-${page}`}
        className="mascot-dialogue"
        role="dialog"
        aria-label="佑子的公会向导"
        initial={{ opacity: 0, y: 14, scale: .98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: .98 }}
        transition={{ duration: .2 }}
      >
        <div className={`mascot-portrait${speaker?.portrait ? ' is-adventurer' : ''}`}>
          <img src={active.portrait ?? '/assets/brand/youzi-mascot.png'} alt={speaker ? `${speaker.name}的像素头像` : '佐佑动漫社看板娘佑子'} draggable={false}/>
          <span aria-hidden="true" />
        </div>
        <div className="dialogue-copy">
          <header><div><strong>{active.name}</strong><small>{active.role}</small></div><button onClick={() => setOpen(false)} aria-label="关闭佑子向导"><X /></button></header>
          <p>{active.line}</p>
          <div className="dialogue-actions">
            {speaker ? <button className="dialogue-reset" onClick={returnToGuide} aria-label="回到佑子向导"><RotateCcw /> 回到佑子</button> : <Link to={guide.action.to}>{guide.action.label}</Link>}
            {!speaker && <button className="dialogue-next" onClick={() => setPage((page + 1) % guidePages.length)} aria-label="下一句"><span>{page + 1}/{guidePages.length}</span><ChevronRight /></button>}
          </div>
        </div>
      </motion.aside> : <motion.button className="mascot-reopen" onClick={() => setOpen(true)} aria-label="和佑子说话" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <img src="/assets/brand/youzi-mascot.png" alt="" aria-hidden="true"/><span>和佑子说话</span>
      </motion.button>}
    </AnimatePresence>
  </div>;
}
