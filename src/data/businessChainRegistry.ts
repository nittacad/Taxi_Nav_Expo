import type { BusinessChainDefinition, BusinessChainId } from '@/types/businessChain';

export const BUSINESS_CHAIN_CHECKOUT_TIME = '10:00' as const;

/** 通知ウィンドウ: 9:30〜10:00（チェックアウト集中帯） */
export const BUSINESS_CHAIN_NOTIFY_WINDOW = {
  startHour: 9,
  startMinute: 30,
  endHour: 10,
  endMinute: 0,
} as const;

export const BUSINESS_CHAIN_REGISTRY: readonly BusinessChainDefinition[] = [
  {
    id: 'apa',
    displayName: 'APAホテル',
    checkoutTime: '10:00',
    matchPatterns: ['APAホテル', 'APA HOTEL', 'アパホテル', 'apa hotel'],
  },
  {
    id: 'toyoko_inn',
    displayName: '東横イン',
    checkoutTime: '10:00',
    matchPatterns: ['東横イン', '東横INN', 'Toyoko Inn', 'toyoko inn'],
  },
  {
    id: 'super_hotel',
    displayName: 'スーパーホテル',
    checkoutTime: '10:00',
    matchPatterns: ['スーパーホテル', 'Super Hotel', 'super hotel'],
  },
  {
    id: 'dormy_inn',
    displayName: 'ドーミーイン',
    checkoutTime: '10:00',
    matchPatterns: ['ドーミーイン', 'ドーミーイン', 'Dormy Inn', 'dormy inn', 'ドーミー'],
  },
  {
    id: 'route_inn',
    displayName: 'ホテルルートイン',
    checkoutTime: '10:00',
    matchPatterns: ['ホテルルートイン', 'ルートイン', 'Route Inn', 'route inn'],
  },
  {
    id: 'comfort_hotel',
    displayName: 'コンフォートホテル',
    checkoutTime: '10:00',
    matchPatterns: ['コンフォートホテル', 'Comfort Hotel', 'comfort hotel'],
  },
  {
    id: 'daiwa_roynet',
    displayName: 'ダイワロイネット',
    checkoutTime: '10:00',
    matchPatterns: ['ダイワロイネット', 'Daiwa Roynet', 'daiwa roynet', 'ロイネットホテル'],
  },
  {
    id: 'sotetsu_fresa',
    displayName: '相鉄フレッサ',
    checkoutTime: '10:00',
    matchPatterns: ['相鉄フレッサ', '相鉄フレッサイン', 'Sotetsu Fresa', 'sotetsu fresa', 'フレッサイン'],
  },
] as const;

const chainById: Readonly<Record<BusinessChainId, BusinessChainDefinition>> = Object.fromEntries(
  BUSINESS_CHAIN_REGISTRY.map((chain) => [chain.id, chain])
) as Record<BusinessChainId, BusinessChainDefinition>;

export function getBusinessChainById(id: BusinessChainId): BusinessChainDefinition {
  return chainById[id];
}

export function matchBusinessChainId(name: string): BusinessChainId | null {
  const normalized = name.trim();
  if (!normalized) return null;

  for (const chain of BUSINESS_CHAIN_REGISTRY) {
    for (const pattern of chain.matchPatterns) {
      if (normalized.includes(pattern)) {
        return chain.id;
      }
    }
  }
  return null;
}
