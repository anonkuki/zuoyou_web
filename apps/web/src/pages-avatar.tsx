import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Dices, Footprints, Save } from 'lucide-react';
import {
  avatarAccents, avatarAccessories, avatarEyes, avatarHairColors, avatarHairStyles, avatarOutfits, avatarSkins,
  defaultAvatarConfig, type AvatarConfig,
} from '@guild/contracts';
import { api, json } from './api';
import { ErrorPanel, LoadingPanel, PageHero } from './components';
import { PixelFrame, PixelDivider } from './components/departments/pixel';
import { PixelAvatar } from './components/avatar/PixelAvatar';
import { avatarAccentColors, avatarHairColorMap, avatarSkinColors } from './components/avatar/avatar-parts';

const optionLabels = {
  skin: { porcelain: '瓷白', light: '浅麦', warm: '暖杏', tan: '蜜糖', deep: '深棕' },
  hairStyle: { short: '短发', long: '长发', twintails: '双马尾', bun: '丸子头', ahoge: '呆毛', curtain: '刘海遮眼', afro: '爆炸头', bald: '光头' },
  hairColor: { black: '墨黑', brown: '栗棕', blonde: '亚麻金', red: '绯红', pink: '樱粉', blue: '湖蓝', purple: '堇紫', white: '月白' },
  eyes: { round: '圆眼', sharp: '英气眼', closed: '眯眯眼', sparkle: '星星眼' },
  outfit: { adventurer: '冒险者外套', hoodie: '连帽卫衣', maid: '女仆装', cloak: '斗篷', band: '乐队T恤', hanfu: '汉服', workwear: '工装', dress: '礼服' },
  accessory: { none: '无配饰', glasses: '眼镜', 'cat-ears': '猫耳', headphones: '耳机', cap: '鸭舌帽', mask: '口罩' },
  accent: { red: '赤红', orange: '暖橙', gold: '鎏金', teal: '青碧', blue: '靛蓝', purple: '堇紫', pink: '樱粉', rose: '玫瑰' },
} as const;

const randomConfig = (): AvatarConfig => {
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];
  return {
    skin: pick(avatarSkins), hairStyle: pick(avatarHairStyles), hairColor: pick(avatarHairColors),
    eyes: pick(avatarEyes), outfit: pick(avatarOutfits), accessory: pick(avatarAccessories), accent: pick(avatarAccents),
  };
};

export function AvatarStudioPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['social', 'self-profile'], queryFn: () => api<{ profile: { avatarConfig?: AvatarConfig | null } }>('/api/member/profile') });
  const [config, setConfig] = useState<AvatarConfig>(defaultAvatarConfig);
  const [walking, setWalking] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (query.data?.profile?.avatarConfig) setConfig(query.data.profile.avatarConfig);
  }, [query.data]);
  const save = useMutation({
    mutationFn: () => api('/api/member/profile', json('PATCH', { avatarConfig: config })),
    onSuccess: async () => {
      setSaved(true);
      await Promise.all([client.invalidateQueries({ queryKey: ['social'] }), client.invalidateQueries({ queryKey: ['auth', 'me'] })]);
    },
  });
  if (query.isLoading) return <main><LoadingPanel label="正在打开形象工房" /></main>;
  if (query.error) return <main><ErrorPanel error={query.error} /></main>;

  const set = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
    setSaved(false);
    setConfig((current) => ({ ...current, [key]: value }));
  };
  const labelOf = (key: keyof typeof optionLabels, value: string) =>
    (optionLabels[key] as Record<string, string>)[value] ?? value;
  const partButton = <K extends 'hairStyle' | 'eyes' | 'outfit' | 'accessory'>(key: K, value: AvatarConfig[K]) => (
    <button
      type="button"
      key={String(value)}
      aria-pressed={config[key] === value}
      className={`avatar-part-option${config[key] === value ? ' active' : ''}`}
      onClick={() => set(key, value)}
    >
      <PixelAvatar config={{ ...config, [key]: value }} size={44} label={labelOf(key, String(value))} />
      <span>{labelOf(key, String(value))}</span>
    </button>
  );
  const swatchButton = (key: 'skin' | 'hairColor' | 'accent', value: string, color: string, label: string) => (
    <button
      type="button"
      key={value}
      aria-pressed={config[key] === value}
      aria-label={label}
      className={`avatar-swatch${config[key] === value ? ' active' : ''}`}
      style={{ '--swatch-color': color } as React.CSSProperties}
      onClick={() => set(key, value as never)}
    ><i /><span>{label}</span></button>
  );
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };

  return <main className="social-page avatar-studio">
    <PageHero eyebrow="AVATAR ATELIER" title="像素形象工房" description="像在 RPG 里创建角色一样，捏出你在公会里的像素小人；广场与名片都会使用它。" />
    <section className="shell avatar-studio-layout">
      <PixelFrame className="avatar-preview-panel">
        <span className="avatar-preview-tag">LIVE PREVIEW</span>
        <div className="avatar-preview-stage" data-walking={walking || undefined}>
          <PixelAvatar config={config} moving={walking} size={168} label="当前像素形象预览" />
        </div>
        <div className="avatar-preview-actions">
          <button type="button" aria-pressed={walking} onClick={() => setWalking(!walking)}><Footprints />{walking ? '停止行走' : '行走演示'}</button>
          <button type="button" onClick={() => { setSaved(false); setConfig(randomConfig()); }}><Dices />随机形象</button>
        </div>
        <Link className="avatar-back" to="/portal/profile"><ArrowLeft />返回个人主页编辑</Link>
      </PixelFrame>
      <form className="avatar-editor" onSubmit={submit}>
        <div className="editor-section"><span>01 · BODY</span><h2>肤色与五官</h2>
          <small className="avatar-group-label">肤色</small>
          <div className="avatar-swatch-row">{avatarSkins.map((skin) => swatchButton('skin', skin, avatarSkinColors[skin], optionLabels.skin[skin]))}</div>
          <small className="avatar-group-label">眼型</small>
          <div className="avatar-part-row">{avatarEyes.map((eyes) => partButton('eyes', eyes))}</div>
        </div>
        <PixelDivider />
        <div className="editor-section"><span>02 · HAIR</span><h2>发型与发色</h2>
          <small className="avatar-group-label">发型</small>
          <div className="avatar-part-row">{avatarHairStyles.map((hairStyle) => partButton('hairStyle', hairStyle))}</div>
          <small className="avatar-group-label">发色</small>
          <div className="avatar-swatch-row">{avatarHairColors.map((hairColor) => swatchButton('hairColor', hairColor, avatarHairColorMap[hairColor], optionLabels.hairColor[hairColor]))}</div>
        </div>
        <PixelDivider />
        <div className="editor-section"><span>03 · OUTFIT</span><h2>服装与配饰</h2>
          <small className="avatar-group-label">服装</small>
          <div className="avatar-part-row">{avatarOutfits.map((outfit) => partButton('outfit', outfit))}</div>
          <small className="avatar-group-label">配饰</small>
          <div className="avatar-part-row">{avatarAccessories.map((accessory) => partButton('accessory', accessory))}</div>
          <small className="avatar-group-label">主题色（腰带 / 鞋 / 小物点缀）</small>
          <div className="avatar-swatch-row">{avatarAccents.map((accent) => swatchButton('accent', accent, avatarAccentColors[accent], optionLabels.accent[accent]))}</div>
        </div>
        {save.error && <p className="form-error">{save.error.message}</p>}
        {saved && <p className="form-success"><Check />像素形象已保存</p>}
        <button className="guild-button primary" disabled={save.isPending}><Save />保存像素形象</button>
      </form>
    </section>
  </main>;
}
