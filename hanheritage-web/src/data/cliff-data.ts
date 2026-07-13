export interface CliffMarker {
  id: number
  code: string
  name: string
  left: number
  top: number
  featured?: boolean
}

export const CLIFF_MARKERS: CliffMarker[] = [
  { id: 1, code: 'CM-01', name: '洞溪崖墓群', left: 13, top: 21 },
  { id: 2, code: 'CM-02', name: '黄溪侯五墙崖墓群', left: 17, top: 28 },
  { id: 3, code: 'CM-03', name: '芭蕉湾崖墓群', left: 31, top: 41 },
  { id: 4, code: 'CM-04', name: '蒋湾和幸福崖墓群', left: 35, top: 50 },
  { id: 5, code: 'CM-05', name: '大耳朵崖墓群', left: 46, top: 33, featured: true },
  { id: 6, code: 'CM-06', name: '魏家祠崖墓群', left: 51, top: 43 },
  { id: 7, code: 'CM-07', name: '观音岩崖墓群', left: 39, top: 47 },
  { id: 8, code: 'CM-08', name: '渔链子崖墓群', left: 41, top: 55 },
  { id: 9, code: 'CM-09', name: '大路边崖墓群', left: 56, top: 51 },
  { id: 10, code: 'CM-10', name: '佛子岩崖墓群', left: 61, top: 45 },
  { id: 11, code: 'CM-11', name: '鱼天堂崖墓群', left: 68, top: 39 },
  { id: 12, code: 'CM-12', name: '高村崖墓群', left: 75, top: 46 },
  { id: 13, code: 'CM-13', name: '梭滩石崖墓群', left: 83, top: 57 },
]

export function getCliffById(id: number): CliffMarker | undefined {
  return CLIFF_MARKERS.find((c) => c.id === id)
}

export const TOMB_MODEL = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'

export const FALLBACK_IMAGES = [
  '/prototype/assets/pano-museum-indoor-hall.png',
  '/prototype/assets/pano-museum-indoor-coffin.png',
  '/prototype/assets/hejiang-han-cliff-distribution.png',
]
