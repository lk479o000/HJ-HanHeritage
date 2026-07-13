<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCoffinData, pad2 } from '@/data/coffin-data'

const route = useRoute()
const router = useRouter()

const fromEar = computed(() => route.query.from === 'ear')

const coffinId = computed(() => {
  const id = Number(route.params.id)
  return isNaN(id) || id < 1 || id > 28 ? 1 : id
})

const idx = ref(coffinId.value)
const autoRotate = ref(false)
const measureOn = ref(false)
const measurePts = ref<number[][]>([])
const stageView = ref('model')
const bgColor = ref('#ddd5c8')

const modelViewerRef = ref<HTMLElement | null>(null)
const stageMediaWrap = ref<HTMLElement | null>(null)
const stageMediaImg = ref<HTMLImageElement | null>(null)
const stageMediaCap = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const introEl = ref<HTMLElement | null>(null)
const hintEl = ref<HTMLElement | null>(null)

type StageViewKey = 'model' | 'ortho' | 'rubbing' | 'line' | 'enhance'

const stageViews: { key: StageViewKey; label: string }[] = [
  { key: 'model', label: '三维模型' },
  { key: 'ortho', label: '数字正射影像图' },
  { key: 'rubbing', label: '数字拓片图' },
  { key: 'line', label: '数字线划图' },
  { key: 'enhance', label: '数字信息增强图' },
]

const coffinData = computed(() => getCoffinData(idx.value))

function setModelRadius(factor: number) {
  const mv = modelViewerRef.value as any
  if (!mv) return
  const orbit = mv.getAttribute('camera-orbit') || '35deg 78deg 5m'
  const m = orbit.match(/([\d.]+)m$/)
  const r = m ? parseFloat(m[1]) : 5
  const nr = Math.max(1.4, Math.min(18, r * factor))
  mv.setAttribute('camera-orbit', orbit.replace(/([\d.]+)m$/, nr.toFixed(2) + 'm'))
}

function setStageView(view: string) {
  stageView.value = view
  const data = coffinData.value
  const mv = modelViewerRef.value as any
  const wrap = stageMediaWrap.value
  const img = stageMediaImg.value
  const cap = stageMediaCap.value

  if (view === 'model') {
    if (mv) mv.style.display = 'block'
    if (wrap) wrap.style.display = 'none'
    if (!measureOn.value && hintEl.value) {
      hintEl.value.textContent = data.name + ' · 默认最佳观察角度：斜前方。已限制底面观察。石棺尺寸测量仅在本页三维模型上可用。'
    }
    return
  }
  const media = data.media[view as keyof typeof data.media]
  if (!media) return
  if (mv) mv.style.display = 'none'
  if (wrap) wrap.style.display = 'block'
  if (img) img.src = media.src
  if (cap) cap.textContent = media.note + ''
  if (hintEl.value) hintEl.value.textContent = data.name + ' · 当前展示：' + media.note
}

function renderCoffin(n: number) {
  idx.value = n
  const d = getCoffinData(n)
  if (titleEl.value) titleEl.value.textContent = d.name + '简介'
  if (introEl.value) introEl.value.textContent = d.intro
  measureOn.value = false
  measurePts.value = []

  const mv = modelViewerRef.value as any
  if (mv) {
    mv.setAttribute('src', d.modelSrc)
    mv.setAttribute('camera-orbit', '35deg 78deg 5m')
    mv.setAttribute('camera-target', '0m 0.2m 0m')
    mv.setAttribute('field-of-view', '30deg')
    if (autoRotate.value) {
      mv.setAttribute('auto-rotate', '')
    } else {
      mv.removeAttribute('auto-rotate')
    }
  }
  setStageView(stageView.value)
}

function onPrev() {
  renderCoffin(idx.value <= 1 ? 28 : idx.value - 1)
}

function onNext() {
  renderCoffin(idx.value >= 28 ? 1 : idx.value + 1)
}

function onSelectChange(e: Event) {
  const val = Number((e.target as HTMLSelectElement).value)
  renderCoffin(Math.max(1, Math.min(28, val || 1)))
}

function zoomIn() {
  setModelRadius(0.85)
}

function zoomOut() {
  setModelRadius(1.15)
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
  renderCoffin(idx.value)
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

function toggleMeasure() {
  measureOn.value = !measureOn.value
  measurePts.value = []
  if (stageView.value === 'model' && hintEl.value) {
    const data = coffinData.value
    hintEl.value.textContent = measureOn.value
      ? data.name + ' · 石棺测量已开启：请在三维石棺上依次点击两个点。'
      : data.name + ' · 石棺测量已关闭。'
  }
}

function onModelClick(e: MouseEvent) {
  if (!measureOn.value || stageView.value !== 'model') return
  const mv = modelViewerRef.value as any
  if (!mv || typeof mv.positionAndNormalFromPoint !== 'function') {
    if (hintEl.value) {
      hintEl.value.textContent = coffinData.value.name + ' · 当前环境无法取点，请使用正式部署的石棺量测能力。'
    }
    return
  }
  mv.positionAndNormalFromPoint(e.clientX, e.clientY).then((hit: any) => {
    if (!hit || hit.position == null) {
      if (hintEl.value) hintEl.value.textContent = coffinData.value.name + ' · 未命中石棺模型表面，请在模型上点击。'
      return
    }
    const p = hit.position
    const ax = p.x != null ? p.x : p[0]
    const ay = p.y != null ? p.y : p[1]
    const az = p.z != null ? p.z : p[2]
    measurePts.value.push([ax, ay, az])
    if (measurePts.value.length === 1) {
      if (hintEl.value) hintEl.value.textContent = coffinData.value.name + ' · 第 1 个点已记录，请在石棺模型上点击第 2 个点。'
      return
    }
    const a = measurePts.value[0]
    const b = measurePts.value[1]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const dz = b[2] - a[2]
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    if (hintEl.value) {
      hintEl.value.textContent =
        coffinData.value.name +
        ' · 两测点直线距离约 ' +
        dist.toFixed(4) +
        '（模型坐标单位，仅供参考）。可继续点击测量下一组。'
    }
    measurePts.value = []
  }).catch(() => {
    if (hintEl.value) hintEl.value.textContent = coffinData.value.name + ' · 取点失败，请待模型加载完成后重试。'
  })
}

watch(coffinId, (newId) => {
  renderCoffin(newId)
})

onMounted(() => {
  renderCoffin(coffinId.value)
})
</script>

<template>
  <div class="page-guofeng">
    <div class="page-shell">
      <header class="top-bar">
        <router-link
          class="btn-touch ghost"
          :to="fromEar ? { name: 'big-ear-cliff' } : { name: 'home' }"
        >
          {{ fromEar ? '← 返回大耳朵崖墓群' : '← 首页' }}
        </router-link>
        <h1>合江石棺展示 · 石棺解读</h1>
        <div class="gf-toolbar-select">
          <button type="button" class="btn-touch" aria-label="上一具石棺" @click="onPrev">← 上一具</button>
          <label for="coffin-select">编号</label>
          <select id="coffin-select" :value="idx" aria-label="选择石棺编号 1至28" @change="onSelectChange">
            <option v-for="i in 28" :key="i" :value="i">{{ pad2(i) }} 号石棺</option>
          </select>
          <button type="button" class="btn-touch" aria-label="下一具石棺" @click="onNext">下一具 →</button>
        </div>
      </header>

      <div class="layout-split coffin-layout">
        <aside class="panel coffin-side-panel">
          <h2 ref="titleEl">{{ coffinData.name }}简介</h2>
          <p ref="introEl" class="muted" style="margin: 0 0 10px; font-size: 0.9rem">{{ coffinData.intro }}</p>

          <p class="muted" style="margin: 12px 0 0; font-size: 0.82rem">
            附属影像按钮已放到右侧三维模型下方，切换后在同一主视区展示。
          </p>
        </aside>

        <section style="display: flex; flex-direction: column; min-height: 0">
          <div class="coffin-main-stage">
            <model-viewer
              ref="modelViewerRef"
              class="proto-model-viewer coffin-main-viewer"
              camera-controls
              touch-action="pan-y"
              interaction-prompt="none"
              shadow-intensity="1"
              environment-image="neutral"
              camera-orbit="35deg 78deg 5m"
              min-camera-orbit="auto 45deg auto"
              max-camera-orbit="auto 98deg auto"
              field-of-view="30deg"
              alt="石棺三维模型"
              @click="onModelClick"
            ></model-viewer>
            <div ref="stageMediaWrap" class="coffin-stage-media" :hidden="stageView === 'model'">
              <figure class="coffin-media-stage-card">
                <img ref="stageMediaImg" alt="石棺附属影像" />
                <figcaption class="muted" ref="stageMediaCap"></figcaption>
              </figure>
            </div>
          </div>
          <p ref="hintEl" class="muted" style="margin: 8px 0 0; font-size: 0.82rem">
            {{ coffinData.name }} · 默认最佳观察角度：斜前方。已限制底面观察。石棺尺寸测量仅在本页三维模型上可用。
          </p>
          <div class="coffin-media-switch">
            <button
              v-for="sv in stageViews"
              :key="sv.key"
              type="button"
              :class="['btn-touch', { 'primary': stageView === sv.key, 'is-active': stageView === sv.key }]"
              @click="setStageView(sv.key)"
            >
              {{ sv.label }}
            </button>
          </div>

          <div class="toolbar-dock">
            <div class="group" style="flex-direction: column; align-items: stretch">
              <span class="label">显示与背景</span>
              <div class="btn-row color-strip">
                <button type="button" class="btn-touch" @click="toggleFullscreen">全屏视口</button>
                <label class="muted" style="display: flex; align-items: center; gap: 8px">
                  背景取色
                  <input type="color" :value="bgColor" aria-label="背景色取色器" @input="onBgColorInput" />
                </label>
              </div>
            </div>
            <div v-if="stageView === 'model'" class="group" style="flex-direction: column; align-items: stretch">
              <span class="label">通用三维交互</span>
              <div class="btn-row">
                <button type="button" class="btn-touch" @click="zoomOut">缩小 −</button>
                <button type="button" class="btn-touch" @click="zoomIn">放大 +</button>
                <button type="button" class="btn-touch" @click="toggleAutoRotate">{{ autoRotate ? '停止旋转' : '自动旋转' }}</button>
                <button type="button" class="btn-touch" @click="resetView">复位</button>
              </div>
            </div>
            <div v-if="stageView === 'model'" class="group" style="flex-direction: column; align-items: stretch">
              <span class="label">石棺尺寸测量（仅三维模型）</span>
              <div class="btn-row">
                <button type="button" class="btn-touch" @click="toggleMeasure">{{ measureOn ? '关闭石棺测量' : '开启石棺测量' }}</button>
              </div>
              <p class="muted" style="margin: 6px 0 0; font-size: 0.78rem; line-height: 1.45">
                在<strong>石棺三维模型</strong>表面依次点选两点，可估算直线距离（模型坐标单位），用于尺寸参考。全景漫游、崖墓群等页面不提供此项。
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
</style>
