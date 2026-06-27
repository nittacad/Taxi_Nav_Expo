export interface MapFocusTarget {
  latitude: number;
  longitude: number;
  label: string;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

type MapFocusListener = (target: MapFocusTarget) => void;

let pendingFocus: MapFocusTarget | null = null;
const listeners = new Set<MapFocusListener>();

export function subscribeMapFocus(listener: MapFocusListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function requestMapFocus(target: MapFocusTarget): void {
  if (listeners.size > 0) {
    listeners.forEach((listener) => listener(target));
    return;
  }
  pendingFocus = target;
}

export function consumeMapFocus(): MapFocusTarget | null {
  const target = pendingFocus;
  pendingFocus = null;
  return target;
}

/** @internal */
export function resetMapFocusForTests(): void {
  pendingFocus = null;
  listeners.clear();
}
