export interface CoffinMarker {
  id: number
  left: number
  top: number
}

export interface CoffinData {
  name: string
  modelSrc: string
  intro: string
  media: {
    ortho: { src: string; note: string }
    rubbing: { src: string; note: string }
    line: { src: string; note: string }
    enhance: { src: string; note: string }
  }
}

const MODEL_POOL = [
  'https://modelviewer.dev/shared-assets/models/Horse.glb',
  'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
  'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
  'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb',
]

const IMG_INDOOR_A = '/prototype/assets/pano-museum-indoor-hall.png'
const IMG_INDOOR_B = '/prototype/assets/pano-museum-indoor-coffin.png'

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function buildMockPoints(total: number): CoffinMarker[] {
  const clusters = [
    { left: 34, top: 30, dx: 4.2, dy: 3.2 },
    { left: 49, top: 44, dx: 4.5, dy: 3.4 },
    { left: 63, top: 34, dx: 3.8, dy: 2.9 },
    { left: 56, top: 57, dx: 4.0, dy: 3.0 },
  ]
  const out: CoffinMarker[] = []
  for (let i = 1; i <= total; i++) {
    const c = clusters[(i - 1) % clusters.length]
    const ring = Math.floor((i - 1) / clusters.length)
    const angle = ((i * 37) % 360) * (Math.PI / 180)
    const radiusX = c.dx * (1 + (ring % 3) * 0.55)
    const radiusY = c.dy * (1 + (ring % 3) * 0.55)
    out.push({
      id: i,
      left: clamp(c.left + Math.cos(angle) * radiusX, 8, 92),
      top: clamp(c.top + Math.sin(angle) * radiusY, 10, 84),
    })
  }
  return out
}

export const COFFIN_MARKERS: CoffinMarker[] = buildMockPoints(28)

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function getCoffinData(n: number): CoffinData {
  const baseName = pad2(n) + ' 号石棺'
  const period = n <= 10 ? '东汉中期' : n <= 20 ? '东汉晚期' : '东汉末至蜀汉初'
  const location = n % 2 === 0 ? '合江县先市镇崖墓点' : '合江县福宝镇崖墓点'
  const motif =
    n % 3 === 0
      ? '车马出行、宴饮乐舞'
      : n % 3 === 1
        ? '神兽护棺、人物故事'
        : '祥瑞纹饰、礼制场景'
  const model = MODEL_POOL[(n - 1) % MODEL_POOL.length]
  const imgMain = n % 2 ? IMG_INDOOR_A : IMG_INDOOR_B
  const imgAlt = n % 2 ? IMG_INDOOR_B : IMG_INDOOR_A
  return {
    name: baseName,
    modelSrc: model,
    intro:
      baseName +
      '，年代约为' +
      period +
      '，出土于' +
      location +
      '。' +
      '画像内容以' +
      motif +
      '为主，反映汉代社会生活与礼制观念，具有较高历史、艺术与研究价值。',
    media: {
      ortho: { src: imgMain, note: baseName + ' · 数字正射影像图' },
      rubbing: { src: imgAlt, note: baseName + ' · 数字拓片图' },
      line: { src: imgMain, note: baseName + ' · 数字线划图' },
      enhance: { src: imgAlt, note: baseName + ' · 数字信息增强图' },
    },
  }
}
