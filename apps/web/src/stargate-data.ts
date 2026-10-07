export interface StargateSubject {
  no: string;
  id: string;
  image: string;
  displayName: string;
  englishName: string;
  transcript: string;
  meta: { tc: string; depth: string; temp: string; file: string };
  accepts: string[];
}

export const stargateSubjects: StargateSubject[] = [
  {
    no: '01', id: 'ainz', image: '/assets/stargate/subject-01-ainz.jpg',
    displayName: '安兹·乌尔·恭', englishName: 'AINZ OOAL GOWN',
    transcript: 'I AM AINZ OOAL GOWN. RULER OF HAZARICK. DO NOT MISTAKE MY MERCY FOR WEAKNESS.',
    meta: { tc: '00:00:11:13', depth: '-475m', temp: '-41C', file: 'REC_01_SAM2_BA00.MP4' },
    accepts: ['安兹乌尔恭', '安兹乌尔', '安兹', 'ainzooalgown', 'ainz'],
  },
  {
    no: '02', id: 'kazuma', image: '/assets/stargate/subject-02-kazuma.jpg',
    displayName: '佐藤和真', englishName: 'KAZUMA SATO',
    transcript: 'THIS IS NOT WHAT I IMAGINED. I DID NOT REINCARNATE FOR THIS.',
    meta: { tc: '00:08:37:05', depth: '-40m', temp: '-3C', file: 'REC_02_SAMI_3B92.MP4' },
    accepts: ['佐藤和真', '和真', 'kazumasato', 'kazuma'],
  },
  {
    no: '03', id: 'subaru', image: '/assets/stargate/subject-03-subaru.jpg',
    displayName: '菜月昴', englishName: 'SUBARU NATSUKI',
    transcript: 'NO MATTER HOW MANY TIME, I DOE, I COME BACK. LET US START OVER. FROM 2:40.',
    meta: { tc: '00:40:10:29', depth: '-32m', temp: '-50C', file: 'REC_03_SAMI_5051.MP4' },
    accepts: ['菜月昴', '菜月昂', '昴', '昂', 'subarunatsuki', 'subaru', '486'],
  },
  {
    no: '04', id: 'tanya', image: '/assets/stargate/subject-04-tanya.jpg',
    displayName: '谭雅·冯·提古雷查夫', englishName: 'TANYA DEGURECHAF',
    transcript: 'EXISTENCE X, ARE YOU WATCHING THIS? SPEED IS ARKOR. FIREPOWER IS EVERYTHING.',
    meta: { tc: '00:44:18:02', depth: '-290m', temp: '-59C', file: 'REC_04_SAMT_AB81.MP4' },
    accepts: ['谭雅冯提古雷查夫', '谭雅', 'tanyadegurechaff', 'tanya'],
  },
  {
    no: '05', id: 'naofumi', image: '/assets/stargate/subject-05-naofumi.jpg',
    displayName: '岩谷尚文', englishName: 'NAOFUMI IWATANI',
    transcript: 'I DO NOT BELIEVE IN THIS WORLD ANYMORE. I AM THE SHIELD. I WILL NOT LET [ ] THROUGH.',
    meta: { tc: '00:01:43:21', depth: '-57m', temp: '-30C', file: 'REC_05_SAKI_25AC.MP4' },
    accepts: ['岩谷尚文', '尚文', 'naofumiiwatani', 'naofumi'],
  },
  {
    no: '06', id: 'cid', image: '/assets/stargate/subject-06-cid.jpg',
    displayName: '希德／暗影', englishName: 'CID KAGENO / SHADOW',
    transcript: 'I AM ATOMIC. I LURK IN THE SHADOWS, AND I HUNT THE SHADOWS.',
    meta: { tc: '00:02:05:15', depth: '-40m', temp: '-9C', file: 'REC_06_SAMP_BAF9.MP4' },
    accepts: ['希德', '暗影', '希德暗影', '希德卡根诺', 'cidkageno', 'cid', 'shadow'],
  },
];

export const stargateDoctor = {
  no: '00', id: 'doctor', image: '/assets/stargate/subject-00-doctor.jpg',
  displayName: '解密者', englishName: 'DOCTOR',
  transcript: 'YOU ARE NOT WATCHING THIS. IT IS WATCHING YOU. WE COUNTED SIX. THERE ARE SEVEN SHADOWS NOW.',
  meta: { tc: '00:08:34:19', depth: '-35m', temp: '-62C', file: 'REC_00_SAMT_3F7E.MP4' },
};

export function normalizeStargateAnswer(input: string): string {
  return input
    .replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .toLowerCase()
    .replace(/[\s\u3000\xb7\u2022\u30fb\u002e\u3002\u3001\uff0c\u002c\u002f\uff0f\u007c\u003a\uff1a\u002d\u2010-\u2015\u007e\uff5e\u005f\u002b\uff0b]/g, '')
    .trim();
}

export function matchStargateSubject(input: string, subject: StargateSubject): boolean {
  const normalized = normalizeStargateAnswer(input);
  if (!normalized) return false;
  return subject.accepts.includes(normalized);
}

export function padStargateSeq(seq: number): string {
  return `#${String(seq).padStart(3, '0')}`;
}
