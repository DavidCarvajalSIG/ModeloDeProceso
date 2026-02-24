export function clamp01(value: number) {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function getPinProgress(rect: DOMRect, viewportHeight: number) {
  const distance = Math.max(1, rect.height - viewportHeight);
  const travelled = -rect.top;
  return clamp01(travelled / distance);
}
