<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import '@google/model-viewer'
import { pad2 } from '@/data/coffin-data'
import { getVisitorCoffins, trackVisitor } from '@/api/visitor'
import type { VisitorCoffin } from '@/api/visitor'

const route = useRoute()

const fromEar = computed(() => route.query.from === 'ear')

const coffinId = computed(() => String(route.params.id ?? ''))

const coffins = ref<VisitorCoffin[]>([])
const idx = ref(coffinId.value)
const lastTrackedId = ref('')
const current = computed(() => coffins.value.find((c) => c.id === idx.value) || null)
const backCliffId = computed(() => current.value?.cliffId ?? '')

const autoRotate = ref(false)
const measureOn = ref(false)
const measurePts = ref<number[][]>([])
const stageView = ref('model')
const bgColor = ref('#ddd5c8')

const modelViewerRef = ref<HTMLElement | null>(null)
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

const coffinData = computed(() => {
  const c = current.value
  const name = c?.name || '石棺加载中…'
  const findImage = (type: string) =>
    c?.images.find((img) => img.imageType === type)?.imageUrl ||
    c?.images[0]?.imageUrl ||
    c?.thumbnail ||
    ''
  return {
    name,
    modelSrc: c?.models[0]?.modelUrl || '',
    intro: c?.description || name,
    media: {
      ortho: { src: findImage('ortho'), note: name + ' · 数字正射影像图' },
      rubbing: { src: findImage('rubbing'), note: name + ' · 数字拓片图' },
      line: { src: findImage('line'), note: name + ' · 数字线划图' },
      enhance: { src: findImage('enhance'), note: name + ' · 数字信息增强图' },
    },
  }
})

const hasModel = computed(() => Boolean(coffinData.value.modelSrc && coffinData.value.modelSrc.trim()))

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
  const img = stageMediaImg.value
  const cap = stageMediaCap.value

  if (view === 'model') {
    if (!measureOn.value && hintEl.value) {
      hintEl.value.textContent = hasModel.value
        ? data.name + ' · 默认最佳观察角度：斜前方。已限制底面观察。石棺尺寸测量仅在本页三维模型上可用。'
        : data.name + ' · 该石棺三维模型待补充，可切换其他影像查看。'
    }
    return
  }
  const media = data.media[view as keyof typeof data.media]
  if (!media) return
  if (img && media.src) img.src = media.src
  if (cap) cap.textContent = media.note + ''
  if (hintEl.value) hintEl.value.textContent = data.name + ' · 当前展示：' + media.note
}

function onStageView(view: StageViewKey) {
  setStageView(view)
  trackVisitor({
    event: 'coffin_stage_switch',
    page: 'coffin',
    targetId: idx.value,
    detail: stageViews.find((item) => item.key === view)?.label,
  })
}

function renderCoffin(id: string) {
  const c = coffins.value.find((item) => item.id === id) || coffins.value[0]
  if (!c) return
  idx.value = c.id
  const d = coffinData.value
  if (titleEl.value) titleEl.value.textContent = d.name + '简介'
  if (introEl.value) introEl.value.textContent = d.intro
  measureOn.value = false
  measurePts.value = []

  const mv = modelViewerRef.value as any
  if (mv) {
    if (d.modelSrc) {
      mv.setAttribute('src', d.modelSrc)
    } else {
      mv.removeAttribute('src')
    }
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
  if (lastTrackedId.value !== c.id) {
    lastTrackedId.value = c.id
    trackVisitor({ event: 'coffin_view', page: 'coffin', targetId: c.id, detail: c.name })
  }
}

function onPrev() {
  const pos = coffins.value.findIndex((item) => item.id === idx.value)
  const next = pos <= 0 ? coffins.value[coffins.value.length - 1] : coffins.value[pos - 1]
  if (next) renderCoffin(next.id)
}

function onNext() {
  const pos = coffins.value.findIndex((item) => item.id === idx.value)
  const next = pos < 0 || pos >= coffins.value.length - 1 ? coffins.value[0] : coffins.value[pos + 1]
  if (next) renderCoffin(next.id)
}

function onSelectChange(e: Event) {
  renderCoffin((e.target as HTMLSelectElement).value)
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

function onFullscreenChange() {
  const target = document.fullscreenElement || modelViewerRef.value
  if (target) target.classList.toggle('viewport-fullscreen', !!document.fullscreenElement)
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
  if (!hasModel.value || !measureOn.value || stageView.value !== 'model') return
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

async function loadCoffins() {
  try {
    const { items } = await getVisitorCoffins()
    coffins.value = items
    const target = items.find((item) => item.id === coffinId.value) || items[0]
    if (!target) return
    await nextTick()
    renderCoffin(target.id)
  } catch {
    coffins.value = []
  }
}

watch(coffinId, (newId) => {
  if (coffins.value.length) renderCoffin(newId)
})

onMounted(() => {
  document.title = '合江石棺展示（石棺解读）'
  document.addEventListener('fullscreenchange', onFullscreenChange)
  loadCoffins()
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<template>
  <div class="page-guofeng">
    <div class="page-shell">
      <header class="top-bar">
        <router-link
          class="btn-touch ghost"
          :to="fromEar && backCliffId ? { name: 'cliff-detail', params: { id: backCliffId } } : { name: 'home' }"
        >
          {{ fromEar ? '← 返回大耳朵崖墓群' : '← 首页' }}
        </router-link>
        <h1>合江石棺展示 · 石棺解读</h1>
        <div class="gf-toolbar-select">
          <button type="button" class="btn-touch" aria-label="上一具石棺" @click="onPrev">← 上一具</button>
          <label for="coffin-select">编号</label>
          <select id="coffin-select" :value="idx" aria-label="选择石棺" @change="onSelectChange">
            <option v-for="c in coffins" :key="c.id" :value="c.id">{{ pad2(c.order) }} 号石棺</option>
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
              v-show="stageView === 'model' && hasModel"
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
            <div
              v-show="stageView === 'model' && !hasModel"
              class="coffin-model-empty"
            >
              <p>该石棺三维模型待补充</p>
            </div>
            <div v-show="stageView !== 'model'" class="coffin-stage-media">
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
              @click="onStageView(sv.key)"
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
.coffin-model-empty {
  display: flex;
  flex: 1;
  min-height: 380px;
  align-items: center;
  justify-content: center;
  border: 1px dashed #b8c9c5;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  color: #5a6b67;

  p {
    margin: 0;
    font-size: 1rem;
    letter-spacing: 0.08em;
  }
}
</style>
