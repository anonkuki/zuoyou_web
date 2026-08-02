type GuildCrestProps = {
  className?: string;
  symbol?: boolean;
  transform?: string;
};

function CrestArtwork() {
  return <>
    <path data-crest-layer="outer-frame" className="crest-outer" d="M50 2 88 14 84 66 68 87 50 98 32 87 16 66 12 14Z" />
    <path data-crest-layer="shield-field" className="crest-field" d="M50 10 80 20 77 62 63 80 50 89 37 80 23 62 20 20Z" />
    <path data-crest-layer="left-wing" className="crest-wing" d="M42 38 14 25 23 43 7 43 28 58 15 62 41 70Z" />
    <path data-crest-layer="right-wing" className="crest-wing" d="m58 38 28-13-9 18h16L72 58l13 4-26 8Z" />
    <path data-crest-layer="blade" className="crest-blade" d="M46 20 50 9l4 11-2 48 8 7-10 13-10-13 8-7Z" />
    <path data-crest-layer="rune" className="crest-rune" d="M38 40h24v7L47 62h15v8H37v-7l15-15H38Z" />
    <circle data-crest-layer="crown-gem" className="crest-gem" cx="50" cy="17" r="4" />
  </>;
}

export function GuildCrest({ className = '', symbol = false, transform }: GuildCrestProps) {
  if (symbol) return <g className={`guild-crest ${className}`} data-testid="guild-crest" aria-hidden="true" transform={transform}><CrestArtwork /></g>;
  return <svg className={`guild-crest ${className}`} data-testid="guild-crest" role="img" aria-label="佐佑冒险者公会纹章" viewBox="0 0 100 100"><CrestArtwork /></svg>;
}
