<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { TOMB_MODEL } from '@/data/cliff-data'

const active = ref<'tomb'>('tomb')
const autoRotate = ref(false)
const bgColor = ref('#d9e5e2')
const sceneMeta = ref('')

const modelViewerRef = ref<HTMLElement | null>(null)

const MODELS = {
  tomb: {
    name: '大耳朵崖墓群',
    src: TOMB_MODEL,
    near: '22deg 78deg 12m',
    far: '10deg 35deg 34m',
    target: '0m 0m 0m',
    fov: '30deg',
    note: '无人机实景三维模型',
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

function applyScene(key: 'tomb') {
  const cfg = MODELS[key]
  const mv = modelViewerRef.value as any
  if (!mv || !cfg) return
  active.value = key
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
  const cfg = MODELS.tomb
  const mv = modelViewerRef.value as any
  if (!mv) return
  mv.setAttribute('camera-orbit', type === 'near' ? cfg.near : cfg.far)
  mv.setAttribute('camera-target', cfg.target)
  mv.setAttribute('field-of-view', cfg.fov)
  setMeta((type === 'near' ? '已跳转：大耳朵崖墓近景。' : '已跳转：大耳朵崖墓全景。') + ' 你可继续自由浏览。')
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
  const mv = modelViewerRef.value
  if (!mv) return
  if (!document.fullscreenElement) {
    mv.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen()
  }
}

function onBgColorInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  bgColor.value = val
  const mv = modelViewerRef.value as any
  if (mv) mv.style.background = val
}

onMounted(() => {
  applyScene('tomb')
})
</script>

<template>
  <div class="page-guofeng">
    <div class="page-shell">
      <header class="top-bar">
        <router-link class="btn-touch ghost" :to="{ name: 'home' }" aria-label="返回首页">← 首页</router-link>
        <h1>大耳朵崖墓群</h1>
      </header>

      <div class="layout-split">
        <aside class="panel">
          <h2>大耳朵崖墓群简介</h2>
          <figure class="gf-intro-figure">
            <img src="https://pannellum.org/images/alma.jpg" alt="大耳朵崖墓群简介示意图" loading="lazy" decoding="async" />
            <figcaption class="muted">图：大耳朵崖墓群实景图</figcaption>
          </figure>
          <p class="muted" style="margin: 10px 0 0; font-size: 0.92rem">
            大耳朵崖墓群位于合江县崖墓文化带核心区，本页整合<strong>崖墓群实景三维</strong>与<strong>关联石棺模型</strong>。支持自由平移/旋转/缩放，且可一键跳转至近景与全景视点后继续自由浏览。
          </p>
          <h3>石棺入口</h3>
          <div class="btn-row gf-model-switch" style="margin-top: 8px">
            <button
              type="button"
              :class="['btn-touch', 'primary', { 'is-active': active === 'tomb' }]"
              @click="applyScene('tomb')"
            >
              崖墓群模型
            </button>
            <router-link class="btn-touch" :to="{ name: 'coffin', params: { id: 1 }, query: { from: 'ear' } }">石棺 1</router-link>
            <router-link class="btn-touch" :to="{ name: 'coffin', params: { id: 2 }, query: { from: 'ear' } }">石棺 2</router-link>
          </div>
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
            alt="大耳朵崖墓群及石棺三维模型"
            style="flex: 1; min-height: 380px"
          ></model-viewer>

          <div class="toolbar-dock">
            <div class="group" style="flex-direction: column; align-items: stretch">
              <span class="label">固定视点（仅崖墓群模型）</span>
              <div class="btn-row">
                <button type="button" class="btn-touch primary" title="切换至崖墓近景预设相机" @click="jumpView('near')">大耳朵崖墓近景</button>
                <button type="button" class="btn-touch primary" title="切换至崖墓全景预设相机" @click="jumpView('far')">大耳朵崖墓全景</button>
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
                <label class="muted" style="display: flex; align-items: center; gap: 8px">
                  背景取色
                  <input type="color" :value="bgColor" aria-label="崖墓群背景色取色器" @input="onBgColorInput" />
                </label>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer class="proto-foot">
        <router-link :to="{ name: 'panorama' }">全景漫游</router-link>
      </footer>
    </div>
  </div>
</template>

<style scoped lang="scss">
</style>
