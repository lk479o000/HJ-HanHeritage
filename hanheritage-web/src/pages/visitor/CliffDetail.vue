<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CLIFF_MARKERS, TOMB_MODEL, FALLBACK_IMAGES, getCliffById } from '@/data/cliff-data'

const route = useRoute()
const router = useRouter()

const cliffId = computed(() => {
  const id = Number(route.params.id)
  return isNaN(id) || id < 1 || id > 13 ? 5 : id
})

const cliff = computed(() => {
  return getCliffById(cliffId.value) || {
    id: cliffId.value,
    code: 'CM-' + String(cliffId.value).padStart(2, '0'),
    name: '崖墓群 ' + String(cliffId.value).padStart(2, '0'),
    left: 50,
    top: 50,
  }
})

const isBigEar = computed(() => cliffId.value === 5)

const photoSet = computed(() => [
  { src: FALLBACK_IMAGES[0], note: cliff.value.name + ' · 现场照片 1' },
  { src: FALLBACK_IMAGES[1], note: cliff.value.name + ' · 现场照片 2' },
  { src: FALLBACK_IMAGES[2], note: cliff.value.name + ' · 区位与分布图' },
])

const active = ref<'tomb' | 'image'>(isBigEar.value ? 'tomb' : 'image')
const autoRotate = ref(false)
const imageIndex = ref(0)
const imageZoom = ref(false)
const bgColor = ref('#d9e5e2')
const sceneMeta = ref('')

const modelViewerRef = ref<HTMLElement | null>(null)
const imageStageRef = ref<HTMLElement | null>(null)
const imageElRef = ref<HTMLImageElement | null>(null)
const imageCapRef = ref<HTMLElement | null>(null)

const MODELS = {
  tomb: {
    name: cliff.value.name,
    src: TOMB_MODEL,
    near: '22deg 78deg 12m',
    far: '10deg 35deg 34m',
    target: '0m 0m 0m',
    fov: '30deg',
    note: '崖墓群实景三维模型',
  },
}

function setMeta(msg: string) {
  sceneMeta.value = msg
}

function getRadius(orbit: string | null): number {
  const m = String(orbit || '').match(/([\d.]+)m$/)
  return m ? parseFloat(m[1]) : 10
}

function setOrbitRadius(r: number) {
  const mv = modelViewerRef.value as any
  if (!mv) return
  const cur = mv.getAttribute('camera-orbit') || '0deg 75deg 10m'
  const parts = cur.split(' ')
  parts[2] = Math.max(1, r).toFixed(2) + 'm'
  mv.setAttribute('camera-orbit', parts.join(' '))
}

function updateViewerMode() {
  const mv = modelViewerRef.value as any
  const inModel = active.value === 'tomb'
  if (mv) mv.style.display = inModel ? 'block' : 'none'
  if (imageStageRef.value) imageStageRef.value.style.display = inModel ? 'none' : 'block'
}

function showImage(idx: number) {
  if (!photoSet.value.length) return
  imageIndex.value = (idx + photoSet.value.length) % photoSet.value.length
  const it = photoSet.value[imageIndex.value]
  if (imageElRef.value) {
    imageElRef.value.src = it.src
    imageElRef.value.style.transform = imageZoom.value ? 'scale(1.6)' : 'scale(1)'
    imageElRef.value.style.transition = 'transform .2s ease'
  }
  if (imageCapRef.value) {
    imageCapRef.value.textContent = it.note + '（' + (imageIndex.value + 1) + '/' + photoSet.value.length + '）'
  }
}

function applyScene(key: 'tomb' | 'image') {
  if (key === 'image') {
    active.value = 'image'
    updateViewerMode()
    showImage(imageIndex.value)
    setMeta('当前：图片查看 · 支持上一张/下一张和放大。')
    return
  }
  const cfg = MODELS.tomb
  const mv = modelViewerRef.value as any
  if (!mv || !cfg) return
  active.value = 'tomb'
  updateViewerMode()
  mv.setAttribute('src', cfg.src)
  mv.setAttribute('camera-target', cfg.target)
  mv.setAttribute('camera-orbit', cfg.far)
  mv.setAttribute('field-of-view', cfg.fov)
  if (autoRotate.value) {
    mv.setAttribute('auto-rotate', '')
  } else {
    mv.removeAttribute('auto-rotate')
  }
  setMeta('当前：' + cfg.name + ' · ' + cfg.note + ' · 可继续自由平移/旋转/缩放')
}

function jumpView(type: 'near' | 'far') {
  if (active.value !== 'tomb') {
    setMeta('固定视点仅作用于崖墓群模型。')
    return
  }
  const cfg = MODELS.tomb
  const mv = modelViewerRef.value as any
  if (!mv) return
  mv.setAttribute('camera-orbit', type === 'near' ? cfg.near : cfg.far)
  mv.setAttribute('camera-target', cfg.target)
  mv.setAttribute('field-of-view', cfg.fov)
  setMeta((type === 'near' ? '已跳转：崖墓近景。' : '已跳转：崖墓全景。') + ' 你可继续自由浏览。')
}

function zoomIn() {
  const mv = modelViewerRef.value as any
  if (!mv) return
  setOrbitRadius(getRadius(mv.getAttribute('camera-orbit')) * 0.85)
}

function zoomOut() {
  const mv = modelViewerRef.value as any
  if (!mv) return
  setOrbitRadius(getRadius(mv.getAttribute('camera-orbit')) * 1.15)
}

function toggleAutoRotate() {
  autoRotate.value = !autoRotate.value
  const mv = modelViewerRef.value as any
  if (!mv) return
  if (autoRotate.value) {
    mv.setAttribute('auto-rotate', '')
  } else {
    mv.removeAttribute('auto-rotate')
  }
}

function resetView() {
  applyScene(active.value)
}

function toggleFullscreen() {
  const targetEl = active.value === 'tomb' ? modelViewerRef.value : imageStageRef.value
  if (!targetEl) return
  if (!document.fullscreenElement) {
    targetEl.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen()
  }
}

function prevImage() {
  showImage(imageIndex.value - 1)
}

function nextImage() {
  showImage(imageIndex.value + 1)
}

function toggleImageZoom() {
  imageZoom.value = !imageZoom.value
  showImage(imageIndex.value)
}

function onBgColorInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  bgColor.value = val
  const mv = modelViewerRef.value as any
  if (mv) mv.style.background = val
}

onMounted(() => {
  if (!isBigEar.value) {
    active.value = 'image'
    updateViewerMode()
    showImage(0)
    setMeta('当前为图片查看。')
  } else {
    updateViewerMode()
    applyScene('tomb')
  }
})
</script>

<template>
  <div class="page-guofeng">
    <div class="page-shell">
      <header class="top-bar">
        <router-link class="btn-touch ghost" :to="{ name: 'home' }">← 首页</router-link>
        <h1>{{ cliff.code }} {{ cliff.name }}</h1>
      </header>

      <div class="layout-split">
        <aside class="panel">
          <h2>{{ cliff.name }}简介</h2>
          <figure class="gf-intro-figure">
            <img src="https://pannellum.org/images/alma.jpg" alt="崖墓群简介示意图" loading="lazy" decoding="async" />
            <figcaption class="muted">图：{{ cliff.name }}实景图</figcaption>
          </figure>
          <p class="muted" style="margin: 10px 0 0; font-size: 0.92rem">
            {{ cliff.name }}专属页面。支持图片查看。{{
              isBigEar
                ? ' 该崖墓群出土石棺可从下方按钮进入石棺解读界面查看。'
                : ' 该崖墓群暂无关联石棺入口。'
            }}
          </p>
          <template v-if="isBigEar">
            <h3>模型切换</h3>
            <div class="btn-row gf-model-switch" style="margin-top: 8px">
              <button
                type="button"
                :class="['btn-touch', 'primary', { 'is-active': active === 'tomb' }]"
                @click="applyScene('tomb')"
              >
                崖墓群模型
              </button>
              <button
                type="button"
                :class="['btn-touch', { 'is-active': active === 'image' }]"
                @click="applyScene('image')"
              >
                图片查看
              </button>
              <router-link class="btn-touch" :to="{ name: 'coffin', params: { id: 1 }, query: { from: 'ear' } }">石棺 1</router-link>
              <router-link class="btn-touch" :to="{ name: 'coffin', params: { id: 2 }, query: { from: 'ear' } }">石棺 2</router-link>
            </div>
          </template>
          <p class="muted" style="margin: 10px 0 0; font-size: 0.84rem">{{ sceneMeta }}</p>
        </aside>

        <section style="display: flex; flex-direction: column; min-height: 0">
          <model-viewer
            ref="modelViewerRef"
            class="proto-model-viewer"
            camera-controls
            touch-action="pan-y"
            interaction-prompt="none"
            shadow-intensity="1"
            environment-image="neutral"
            alt="崖墓群三维模型"
            style="flex: 1; min-height: 380px"
          ></model-viewer>
          <div ref="imageStageRef" class="coffin-stage-media" style="display: none; min-height: 380px">
            <figure class="coffin-media-stage-card">
              <img ref="imageElRef" alt="崖墓群图片" />
              <figcaption class="muted" ref="imageCapRef"></figcaption>
            </figure>
          </div>

          <div v-if="isBigEar" class="toolbar-dock">
            <div class="group" style="flex-direction: column; align-items: stretch">
              <span class="label">固定视点（仅崖墓群模型）</span>
              <div class="btn-row">
                <button type="button" class="btn-touch primary" @click="jumpView('near')">崖墓近景</button>
                <button type="button" class="btn-touch primary" @click="jumpView('far')">崖墓全景</button>
              </div>
            </div>
            <div class="group" style="flex-direction: column; align-items: stretch">
              <span class="label">通用三维交互</span>
              <div class="btn-row">
                <button type="button" class="btn-touch" @click="zoomOut">缩小 −</button>
                <button type="button" class="btn-touch" @click="zoomIn">放大 +</button>
                <button type="button" class="btn-touch" @click="toggleAutoRotate">{{ autoRotate ? '停止旋转' : '自动旋转' }}</button>
                <button type="button" class="btn-touch" @click="resetView">复位</button>
              </div>
            </div>
            <div class="group" style="flex-direction: column; align-items: stretch">
              <span class="label">显示与背景</span>
              <div class="btn-row color-strip">
                <button type="button" class="btn-touch" @click="toggleFullscreen">全屏视口</button>
                <button v-if="active === 'image'" type="button" class="btn-touch" @click="prevImage">上一张</button>
                <button v-if="active === 'image'" type="button" class="btn-touch" @click="nextImage">下一张</button>
                <button v-if="active === 'image'" type="button" class="btn-touch" @click="toggleImageZoom">{{ imageZoom ? '恢复大小' : '图片放大' }}</button>
                <label class="muted" style="display: flex; align-items: center; gap: 8px">
                  背景取色
                  <input type="color" :value="bgColor" aria-label="崖墓群背景色取色器" @input="onBgColorInput" />
                </label>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer class="proto-foot"></footer>
    </div>
  </div>
</template>

<style scoped lang="scss">
</style>
