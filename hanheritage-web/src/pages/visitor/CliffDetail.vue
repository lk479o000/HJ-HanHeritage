<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import '@google/model-viewer'
import { FALLBACK_IMAGES } from '@/data/cliff-data'
import { getVisitorCliff, trackVisitor } from '@/api/visitor'

const route = useRoute()
const router = useRouter()

const cliffId = computed(() => {
  const id = Number(route.params.id)
  return isNaN(id) || id < 1 ? 5 : id
})

const cliff = ref({
  id: cliffId.value,
  code: '',
  name: '',
  description: '',
  coverImage: '',
  modelUrl: '',
  images: [] as Array<{ imageUrl: string; sort?: number }>,
})

const coffins = ref<Array<{ id: string; name: string; code?: string }>>([])

const isBigEar = computed(() => coffins.value.length > 0)

const introText = computed(() =>
  isBigEar.value
    ? '该崖墓群出土石棺可从下方按钮进入石棺解读界面查看。'
    : '该崖墓群暂无关联石棺入口。'
)

const photoSet = computed(() => {
  const dbImages = cliff.value.images
    .map(img => img.imageUrl)
    .filter(Boolean)
  if (dbImages.length > 0) {
    return dbImages.map((src, index) => ({
      src,
      note: `${cliff.value.name} · 现场照片 ${index + 1}`,
    }))
  }
  if (cliff.value.coverImage) {
    return [{ src: cliff.value.coverImage, note: `${cliff.value.name} · 封面图` }]
  }
  return [
    { src: FALLBACK_IMAGES[0], note: cliff.value.name + ' · 现场照片 1' },
    { src: FALLBACK_IMAGES[1], note: cliff.value.name + ' · 现场照片 2' },
    { src: FALLBACK_IMAGES[2], note: cliff.value.name + ' · 区位与分布图' },
  ]
})

const active = ref<'tomb' | 'image'>('tomb')
const autoRotate = ref(false)
const imageIndex = ref(0)
const imageZoom = ref(false)
const bgColor = ref('#d9e5e2')
const sceneMeta = ref('')

const modelViewerRef = ref<HTMLElement | null>(null)
const modelEmptyRef = ref<HTMLElement | null>(null)
const imageStageRef = ref<HTMLElement | null>(null)
const imageElRef = ref<HTMLImageElement | null>(null)
const imageCapRef = ref<HTMLElement | null>(null)

const hasModel = computed(() => Boolean(cliff.value.modelUrl && cliff.value.modelUrl.trim()))

const MODELS = {
  tomb: {
    get name() {
      return cliff.value.name
    },
    get src() {
      return cliff.value.modelUrl
    },
    near: '22deg 78deg 12m',
    far: '10deg 35deg 34m',
    target: '0m 0m 0m',
    fov: '30deg',
    note: '崖墓群实景三维模型',
  },
}

async function loadCliff() {
  try {
    const data = await getVisitorCliff(cliffId.value)
    cliff.value = {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description ?? '',
      coverImage: data.coverImage ?? '',
      modelUrl: data.modelUrl ?? '',
      images: Array.isArray(data.images)
        ? data.images.map((img: any) => ({ imageUrl: img.imageUrl, sort: img.sort }))
        : [],
    }
    coffins.value = data.coffins ?? []
    trackVisitor({ event: 'cliff_view', page: 'cliff', targetId: cliffId.value })
    active.value = 'tomb'
    updateViewerMode()
    await nextTick()
    applyScene('tomb')
  } catch {
    router.replace({ name: 'home' })
  }
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
  const inModel = active.value === 'tomb' && hasModel.value
  const inEmpty = active.value === 'tomb' && !hasModel.value
  if (mv) mv.style.display = inModel ? 'block' : 'none'
  if (modelEmptyRef.value) modelEmptyRef.value.style.display = inEmpty ? 'flex' : 'none'
  if (imageStageRef.value) imageStageRef.value.style.display = active.value === 'tomb' ? 'none' : 'block'
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
  if (!hasModel.value) {
    active.value = 'tomb'
    updateViewerMode()
    setMeta('该崖墓三维模型待补充。')
    return
  }
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

function onFullscreenChange() {
  const target =
    document.fullscreenElement || (active.value === 'tomb' ? modelViewerRef.value : imageStageRef.value)
  if (target) target.classList.toggle('viewport-fullscreen', !!document.fullscreenElement)
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

watch(cliff, () => {
  document.title = cliff.value.name + ' — 专属界面'
}, { immediate: true })

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  loadCliff()
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
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
            <img :src="photoSet[0].src" alt="崖墓群简介示意图" loading="lazy" decoding="async" />
            <figcaption class="muted">图：{{ cliff.name }}实景图</figcaption>
          </figure>
          <div v-if="cliff.description" class="muted gf-intro-desc" v-html="cliff.description"></div>
          <p v-else class="muted" style="margin: 10px 0 0; font-size: 0.92rem">
            {{ cliff.name }}专属页面。支持图片查看。{{ introText }}
          </p>
          <h3>模型切换</h3>
          <div class="btn-row gf-model-switch" style="margin-top: 8px">
            <button
              type="button"
              :class="['btn-touch', { primary: active === 'tomb', 'is-active': active === 'tomb' }]"
              @click="applyScene('tomb')"
            >
              崖墓群模型
            </button>
            <button
              type="button"
              :class="['btn-touch', { primary: active === 'image', 'is-active': active === 'image' }]"
              @click="applyScene('image')"
            >
              图片查看
            </button>
            <router-link
              v-for="(item, index) in coffins.slice(0, 2)"
              :key="item.id"
              class="btn-touch"
              :to="{ name: 'coffin', params: { id: item.id }, query: { from: 'ear' } }"
            >石棺 {{ index + 1 }}</router-link>
          </div>
          <p class="muted" style="margin: 10px 0 0; font-size: 0.84rem">{{ sceneMeta }}</p>
        </aside>

        <section style="display: flex; flex-direction: column; min-height: 0">
          <model-viewer
            v-if="hasModel"
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
          <div
            v-else
            ref="modelEmptyRef"
            class="cliff-model-empty"
            style="display: none; flex: 1; min-height: 380px"
          >
            <p>该崖墓三维模型待补充</p>
          </div>
          <div ref="imageStageRef" class="coffin-stage-media" style="display: none; min-height: 380px">
            <figure class="coffin-media-stage-card">
              <img ref="imageElRef" alt="崖墓群图片" />
              <figcaption class="muted" ref="imageCapRef"></figcaption>
            </figure>
          </div>

          <div class="toolbar-dock">
            <div v-if="isBigEar" class="group" style="flex-direction: column; align-items: stretch">
              <span class="label">固定视点（仅崖墓群模型）</span>
              <div class="btn-row">
                <button type="button" class="btn-touch primary" @click="jumpView('near')">崖墓近景</button>
                <button type="button" class="btn-touch primary" @click="jumpView('far')">崖墓全景</button>
              </div>
            </div>
            <div v-if="isBigEar" class="group" style="flex-direction: column; align-items: stretch">
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
                <button type="button" class="btn-touch" @click="prevImage">上一张</button>
                <button type="button" class="btn-touch" @click="nextImage">下一张</button>
                <button type="button" class="btn-touch" @click="toggleImageZoom">{{ imageZoom ? '恢复大小' : '图片放大' }}</button>
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
.gf-intro-desc {
  margin-top: 10px;
  font-size: 0.92rem;
}

.cliff-model-empty {
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
