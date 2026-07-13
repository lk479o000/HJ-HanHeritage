<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

interface PanoScene {
  id: string
  title: string
  pano: string
  thumb: string
  view?: { pitch: number; yaw: number; hfov: number }
  partial?: Record<string, number>
}

const DEMO_PANO = 'https://pannellum.org/images/alma.jpg'

const TYPE_HINTS: Record<string, string> = {
  air: '空中：无人机/高架等距柱状全景；拖拽环视 360°×180°，滚轮或右下角控件缩放。',
  ground: '地面：馆区步行视点。',
  indoor: '室内：展厅实景（参考示意图）；非标准等距图时使用局部视角包装，仅为交互示意。',
  outdoor: '室外：馆外环境与庭院。',
}

const MUSEUM_SCENES: Record<string, PanoScene[]> = {
  air: [
    {
      id: 'm-air-1',
      title: '博物馆院区·航拍全景 A',
      pano: DEMO_PANO,
      thumb: DEMO_PANO,
      view: { pitch: 2, yaw: 0, hfov: 95 },
    },
    {
      id: 'm-air-2',
      title: '博物馆院区·航拍全景 B',
      pano: DEMO_PANO,
      thumb: DEMO_PANO,
      view: { pitch: -4, yaw: 135, hfov: 88 },
    },
  ],
  ground: [
    {
      id: 'm-gr-1',
      title: '入口广场·地面点位 A',
      pano: DEMO_PANO,
      thumb: DEMO_PANO,
      view: { pitch: 0, yaw: 40, hfov: 92 },
    },
    {
      id: 'm-gr-2',
      title: '馆前步道·地面点位 B',
      pano: DEMO_PANO,
      thumb: DEMO_PANO,
      view: { pitch: 3, yaw: -70, hfov: 100 },
    },
  ],
  indoor: [
    {
      id: 'm-in-1',
      title: '展厅通道·石棺阵列',
      pano: '/prototype/assets/pano-museum-indoor-hall.png',
      thumb: '/prototype/assets/pano-museum-indoor-hall.png',
      partial: { haov: 108, vaov: 68, minHfov: 36, maxHfov: 108, hfov: 86, pitch: 0, yaw: 0 },
    },
    {
      id: 'm-in-2',
      title: '1 号石棺展柜近景',
      pano: '/prototype/assets/pano-museum-indoor-coffin.png',
      thumb: '/prototype/assets/pano-museum-indoor-coffin.png',
      partial: { haov: 108, vaov: 68, minHfov: 36, maxHfov: 108, hfov: 86, pitch: 0, yaw: 0 },
    },
  ],
  outdoor: [
    {
      id: 'm-out-1',
      title: '馆外立面·室外点位 A',
      pano: DEMO_PANO,
      thumb: DEMO_PANO,
      view: { pitch: 1, yaw: 20, hfov: 96 },
    },
    {
      id: 'm-out-2',
      title: '庭院与周边环境·室外点位 B',
      pano: DEMO_PANO,
      thumb: DEMO_PANO,
      view: { pitch: -2, yaw: 200, hfov: 90 },
    },
  ],
}

const panoTypes = [
  { key: 'air', label: '空中' },
  { key: 'ground', label: '地面' },
  { key: 'indoor', label: '室内' },
  { key: 'outdoor', label: '室外' },
]

const currentType = ref('air')
const currentIndex = ref(0)
const sceneTitle = ref('当前场景')
const typeHint = ref(TYPE_HINTS['air'])
let panoViewer: any = null

const panoHostRef = ref<HTMLElement | null>(null)

function destroyPano() {
  if (panoViewer) {
    try {
      panoViewer.destroy()
    } catch (_e) {}
    panoViewer = null
  }
  if (panoHostRef.value) panoHostRef.value.innerHTML = ''
}

function buildViewerOptions(scene: PanoScene) {
  const opt: Record<string, any> = {
    type: 'equirectangular',
    panorama: scene.pano,
    autoLoad: true,
    showControls: true,
    compass: true,
    mouseZoom: true,
    draggable: true,
    hfov: 90,
    minHfov: 40,
    maxHfov: 120,
    pitch: 0,
    yaw: 0,
  }
  if (scene.partial) {
    Object.keys(scene.partial).forEach((k) => {
      opt[k] = scene.partial![k]
    })
  } else if (scene.view) {
    if (scene.view.pitch != null) opt.pitch = scene.view.pitch
    if (scene.view.yaw != null) opt.yaw = scene.view.yaw
    if (scene.view.hfov != null) opt.hfov = scene.view.hfov
  }
  return opt
}

function loadScene(type: string, index: number) {
  const list = MUSEUM_SCENES[type]
  if (!list || !list.length) return
  index = Math.max(0, Math.min(index, list.length - 1))
  currentType.value = type
  currentIndex.value = index
  const scene = list[index]
  sceneTitle.value = scene.title
  typeHint.value = TYPE_HINTS[type] || ''
  destroyPano()
  if (!panoHostRef.value) return
  if (typeof (window as any).pannellum === 'undefined') {
    panoHostRef.value.innerHTML = '<p class="muted" style="padding:24px;text-align:center">全景库未加载。</p>'
    return
  }
  try {
    panoViewer = (window as any).pannellum.viewer(panoHostRef.value, buildViewerOptions(scene))
  } catch (_e) {
    panoHostRef.value.innerHTML = '<p class="muted" style="padding:24px;text-align:center">全景加载失败，请稍后重试。</p>'
  }
}

function switchType(type: string) {
  loadScene(type, 0)
}

function selectScene(index: number) {
  loadScene(currentType.value, index)
}

onMounted(() => {
  loadScene('air', 0)
})

onBeforeUnmount(() => {
  destroyPano()
})
</script>

<template>
  <div class="page-guofeng">
    <div class="page-shell">
      <header class="top-bar">
        <router-link class="btn-touch ghost" :to="{ name: 'home' }">← 首页</router-link>
        <h1>全景漫游 · 博物馆</h1>
      </header>

      <div class="panel">
        <p class="muted" style="margin: 0 0 12px; font-size: 0.9rem">
          合江县汉代画像石棺博物馆 — 集成<strong>空中、地面、室内、室外</strong>四类全景。支持鼠标/触屏<strong>拖拽环视（360°×180°）</strong>与<strong>缩放</strong>；下方缩略图切换不同点位（与后台「博物馆全景管理」绑定资源）。
        </p>
        <div class="tabs pano-museum-type-tabs" role="tablist" aria-label="博物馆全景类型">
          <button
            v-for="pt in panoTypes"
            :key="pt.key"
            type="button"
            class="tab-btn"
            :aria-selected="currentType === pt.key ? 'true' : 'false'"
            @click="switchType(pt.key)"
          >
            {{ pt.label }}
          </button>
        </div>
        <div class="pano-museum-meta">
          <h3 class="pano-museum-scene-title">{{ sceneTitle }}</h3>
          <p class="muted pano-museum-hint">{{ typeHint }}</p>
        </div>
        <div ref="panoHostRef" class="proto-pano-host pano-museum-viewer" role="region" aria-label="博物馆全景主视口"></div>
        <p class="muted" style="margin: 12px 0 4px; font-size: 0.82rem">场景切换（缩略图列表，点击切换全景点位）</p>
        <div class="pano-scene-strip" role="list" aria-label="博物馆全景点位列表">
          <button
            v-for="(scene, sIdx) in MUSEUM_SCENES[currentType] || []"
            :key="scene.id"
            type="button"
            class="pano-scene-thumb"
            :aria-current="sIdx === currentIndex ? 'true' : 'false'"
            role="listitem"
            @click="selectScene(sIdx)"
          >
            <img :src="scene.thumb" alt="" loading="lazy" decoding="async" />
            <span>{{ scene.title }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
</style>
