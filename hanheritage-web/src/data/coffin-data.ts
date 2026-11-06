function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/** 导览图点位为展示布局，按顺序生成固定坐标，与业务数据无关。 */
export function markerPosition(i: number): { left: number; top: number } {
  const clusters = [
    { left: 34, top: 30, dx: 4.2, dy: 3.2 },
    { left: 49, top: 44, dx: 4.5, dy: 3.4 },
    { left: 63, top: 34, dx: 3.8, dy: 2.9 },
    { left: 56, top: 57, dx: 4.0, dy: 3.0 },
  ]
  const c = clusters[(i - 1) % clusters.length]
  const ring = Math.floor((i - 1) / clusters.length)
  const angle = ((i * 37) % 360) * (Math.PI / 180)
  const radiusX = c.dx * (1 + (ring % 3) * 0.55)
  const radiusY = c.dy * (1 + (ring % 3) * 0.55)
  return {
    left: clamp(c.left + Math.cos(angle) * radiusX, 8, 92),
    top: clamp(c.top + Math.sin(angle) * radiusY, 10, 84),
  }
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}
