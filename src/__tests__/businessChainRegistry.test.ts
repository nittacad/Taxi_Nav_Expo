import { matchBusinessChainId, BUSINESS_CHAIN_REGISTRY } from '@/data/businessChainRegistry';

describe('businessChainRegistry', () => {
  it('defines 8 target chains', () => {
    expect(BUSINESS_CHAIN_REGISTRY.length).toBe(8);
  });

  it('matches APA and Toyoko Inn names', () => {
    expect(matchBusinessChainId('APAホテル〈新小岩駅前〉')).toBe('apa');
    expect(matchBusinessChainId('東横イン 浅草千束')).toBe('toyoko_inn');
    expect(matchBusinessChainId('相鉄フレッサイン 日本橋人形町')).toBe('sotetsu_fresa');
  });

  it('returns null for unrelated hotels', () => {
    expect(matchBusinessChainId('帝国ホテル')).toBeNull();
  });
});
