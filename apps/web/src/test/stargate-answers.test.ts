import { describe, expect, it } from 'vitest';
import { matchStargateSubject, normalizeStargateAnswer, padStargateSeq, stargateSubjects } from '../stargate-data';

const subject = (id: string) => {
  const found = stargateSubjects.find((item) => item.id === id);
  if (!found) throw new Error(`unknown subject ${id}`);
  return found;
};

describe('stargate answer normalization', () => {
  it('strips separators and casing from Chinese and English names', () => {
    expect(normalizeStargateAnswer('安兹·乌尔·恭')).toBe('安兹乌尔恭');
    expect(normalizeStargateAnswer('安兹・乌尔・恭')).toBe('安兹乌尔恭');
    expect(normalizeStargateAnswer('安兹.乌尔. 恭')).toBe('安兹乌尔恭');
    expect(normalizeStargateAnswer('AINZ OOAL GOWN')).toBe('ainzooalgown');
    expect(normalizeStargateAnswer('ＡＩＮＺ')).toBe('ainz');
  });

  it('matches every canonical display name', () => {
    for (const item of stargateSubjects) {
      expect(matchStargateSubject(item.displayName, item)).toBe(true);
    }
  });

  it('accepts common short forms and english aliases', () => {
    expect(matchStargateSubject('安兹', subject('ainz'))).toBe(true);
    expect(matchStargateSubject('Ainz', subject('ainz'))).toBe(true);
    expect(matchStargateSubject('和真', subject('kazuma'))).toBe(true);
    expect(matchStargateSubject('Kazuma Sato', subject('kazuma'))).toBe(true);
    expect(matchStargateSubject('菜月昂', subject('subaru'))).toBe(true);
    expect(matchStargateSubject('昴', subject('subaru'))).toBe(true);
    expect(matchStargateSubject('谭雅', subject('tanya'))).toBe(true);
    expect(matchStargateSubject('Tanya Degurechaff', subject('tanya'))).toBe(true);
    expect(matchStargateSubject('尚文', subject('naofumi'))).toBe(true);
    expect(matchStargateSubject('希德', subject('cid'))).toBe(true);
    expect(matchStargateSubject('暗影', subject('cid'))).toBe(true);
    expect(matchStargateSubject('希德·卡根诺', subject('cid'))).toBe(true);
    expect(matchStargateSubject('Shadow', subject('cid'))).toBe(true);
  });

  it('rejects wrong names, empty input and cross-subject matches', () => {
    expect(matchStargateSubject('佐藤和真', subject('ainz'))).toBe(false);
    expect(matchStargateSubject('随便写', subject('ainz'))).toBe(false);
    expect(matchStargateSubject('', subject('ainz'))).toBe(false);
    expect(matchStargateSubject('   ', subject('ainz'))).toBe(false);
  });

  it('pads sequence numbers to three digits', () => {
    expect(padStargateSeq(1)).toBe('#001');
    expect(padStargateSeq(42)).toBe('#042');
    expect(padStargateSeq(1000)).toBe('#1000');
  });
});
