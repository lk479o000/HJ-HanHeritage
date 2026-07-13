<script setup lang="ts">
import { COFFIN_MARKERS, pad2 } from '@/data/coffin-data'
import { useRouter } from 'vue-router'

const router = useRouter()

function goToCoffin(id: number) {
  router.push({ name: 'coffin', params: { id } })
}
</script>

<template>
  <div class="page-guofeng">
    <div class="page-shell coffin-map-page">
      <header class="top-bar">
        <router-link class="btn-touch ghost" :to="{ name: 'home' }">← 首页</router-link>
        <h1>石棺分布导览</h1>
      </header>

      <section class="panel coffin-map-panel">
        <p class="muted" style="margin: 0 0 10px; font-size: 0.9rem">
          地图标点为模拟点位。点击石棺编号可进入对应石棺详情界面。
        </p>
        <div class="coffin-map-stage" role="application" aria-label="石棺分布模拟地图">
          <img
            class="coffin-map-img"
            src="/prototype/assets/hejiang-han-cliff-distribution.png"
            alt="石棺分布模拟底图"
            width="1200"
            height="900"
            decoding="async"
          />
          <div class="coffin-map-markers">
            <button
              v-for="p in COFFIN_MARKERS"
              :key="p.id"
              type="button"
              class="coffin-marker"
              :style="{ left: p.left + '%', top: p.top + '%' }"
              :aria-label="'石棺 ' + pad2(p.id) + '，打开详情'"
              @click="goToCoffin(p.id)"
            >
              <span class="coffin-marker-code">{{ pad2(p.id) }}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cffin-map-page {
  gap: 10px;
}

.coffin-map-panel {
  margin: 0;
  padding: 12px;
}

.coffin-map-stage {
  position: relative;
  min-height: min(68dvh, 620px);
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(90, 155, 138, 0.38);
  background: #e8ece9;
}

.coffin-map-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 42%;
  display: block;
  user-select: none;
  pointer-events: none;
}

.coffin-map-markers {
  position: absolute;
  inset: 0;
}

.coffin-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  width: clamp(30px, 4.2vw, 40px);
  height: clamp(30px, 4.2vw, 40px);
  border: none;
  border-radius: 999px;
  background: radial-gradient(circle at 35% 30%, #f2cd65 0%, #bf8b0a 55%, #8a6300 100%);
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.94),
    0 4px 12px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;

  &:hover,
  &:focus-visible {
    transform: translate(-50%, -50%) scale(1.1);
    box-shadow:
      0 0 0 3px #fff,
      0 0 0 5px rgba(212, 174, 58, 0.48),
      0 6px 16px rgba(0, 0, 0, 0.42);
    outline: none;
  }
}

.coffin-marker-code {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #fffef7;
  font-size: clamp(0.6rem, 1.4vw, 0.72rem);
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55);
}
</style>
