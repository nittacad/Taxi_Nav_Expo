import { BUSINESS_CHAIN_NOTIFY_WINDOW } from '@/data/businessChainRegistry';

/** 9:30〜10:00（end 含む） */
export function isInBusinessChainNotifyWindow(date: Date = new Date()): boolean {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const start =
    BUSINESS_CHAIN_NOTIFY_WINDOW.startHour * 60 + BUSINESS_CHAIN_NOTIFY_WINDOW.startMinute;
  const end = BUSINESS_CHAIN_NOTIFY_WINDOW.endHour * 60 + BUSINESS_CHAIN_NOTIFY_WINDOW.endMinute;
  return minutes >= start && minutes <= end;
}
