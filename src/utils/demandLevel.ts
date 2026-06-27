export type DemandLevel = 'low' | 'medium' | 'high';

export function getDemandColor(demand: number): string {
  if (demand >= 80) return '#E74C3C';
  if (demand >= 60) return '#F39C12';
  if (demand >= 40) return '#F1C40F';
  return '#27AE60';
}

export function getDemandLevelColor(level: DemandLevel): string {
  switch (level) {
    case 'high':
      return '#E74C3C';
    case 'medium':
      return '#F39C12';
    case 'low':
      return '#27AE60';
  }
}

export function getDemandLevelLabel(level: DemandLevel | string): string {
  switch (level) {
    case 'high':
      return '高需要';
    case 'medium':
      return '中需要';
    case 'low':
      return '低需要';
    default:
      return '';
  }
}
