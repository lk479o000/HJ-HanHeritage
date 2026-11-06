<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getVisitorCliffs, trackVisitor } from '@/api/visitor'
import { useRouter } from 'vue-router'

const router = useRouter()

interface CliffMarker {
  id: string
  name: string
  left: number
  top: number
  featured: number
  order: number
}

const cliffMarkers = ref<CliffMarker[]>([])
const featuredCliffId = computed(
  () => cliffMarkers.value.find((m) => m.featured)?.id ?? cliffMarkers.value[0]?.id ?? ''
)

function fallbackPosition(index: number) {
  return {
    left: 12 + (index % 7) * 12,
    top: 20 + Math.floor(index / 7) * 14,
  }
}

async function loadCliffs() {
  try {
    const { items } = await getVisitorCliffs()
    cliffMarkers.value = items.map((item, index) => {
      const fallback = fallbackPosition(index)
      return {
        id: item.id,
        name: item.name,
        left: item.mapLeft ?? fallback.left,
        top: item.mapTop ?? fallback.top,
        featured: item.featured,
        order: item.order,
      }
    })
  } catch {
    cliffMarkers.value = []
  }
}

onMounted(() => {
  document.title = '汉墓秘境，汉韵仙踪'
  loadCliffs()
  trackVisitor({ event: 'home_view', page: 'home' })
})

function goToCliff(id: string) {
  router.push({ name: 'cliff-detail', params: { id } })
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}
</script>

<template>
  <div class="map-home">
    <header class="map-home-header">
      <h1>汉墓秘境，汉韵仙踪</h1>
    </header>

    <div class="map-home-view">
      <div class="map-stage" role="application" aria-label="合江县汉代崖墓分布图，含十三处崖墓群标点与功能入口">
        <img
          class="map-home-img"
          src="/prototype/assets/hejiang-han-cliff-distribution.png"
          alt="合江县汉代崖墓分布图：县界、河流、公路与十三处崖墓群位置示意"
          width="1200"
          height="900"
          decoding="async"
        />
        <div class="map-markers">
          <button
            v-for="row in cliffMarkers"
            :key="row.id"
            type="button"
            :class="['map-marker', { 'map-marker--featured': row.featured }]"
            :style="{ left: row.left + '%', top: row.top + '%' }"
            :aria-label="row.name + '，打开详情'"
            @click="goToCliff(row.id)"
          >
            <span class="map-marker-code">{{ pad2(row.order) }}</span>
            <span class="map-marker-label" aria-hidden="true">{{ row.name }}</span>
          </button>
        </div>
        <nav class="map-home-actions--dock" aria-label="核心功能入口">
          <router-link class="map-home-btn map-home-btn--pano" :to="{ name: 'panorama' }">全景漫游</router-link>
          <router-link class="map-home-btn map-home-btn--coffin" :to="{ name: 'coffin-map' }">石棺解读</router-link>
          <router-link
            v-if="featuredCliffId"
            class="map-home-btn map-home-btn--ear"
            :to="{ name: 'cliff-detail', params: { id: featuredCliffId } }"
          >{{ cliffMarkers.find((m) => m.featured)?.name || '大耳朵崖墓群' }}</router-link>
        </nav>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.map-home {
  margin: 0;
  min-height: 100dvh;
  color: #1e2d2a;
  background: #1a2520;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.map-home-header {
  flex-shrink: 0;
  padding: clamp(12px, 2dvh, 20px) clamp(16px, 3vw, 28px) 10px;
  text-align: center;
  background: linear-gradient(180deg, rgba(245, 250, 248, 0.98) 0%, rgba(232, 242, 238, 0.96) 100%);
  border-bottom: 1px solid rgba(90, 155, 138, 0.35);

  h1 {
    margin: 0;
    font-family: 'STKaiti', 'KaiTi', 'SimSun', 'Noto Serif SC', serif;
    font-size: clamp(1.25rem, 3.2vw, 1.75rem);
    font-weight: 700;
    color: #1e2d2a;
    letter-spacing: 0.12em;
  }
}

.map-home-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin: clamp(6px, 1.2dvh, 12px) clamp(12px, 2vw, 24px) clamp(10px, 1.5dvh, 16px);
}

.map-stage {
  position: relative;
  flex: 1;
  min-height: min(58dvh, 480px);
  --map-dock-h: 82px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(90, 155, 138, 0.45);
  box-shadow:
    0 4px 24px rgba(30, 50, 45, 0.25),
    inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  background: #e8ece9;
  display: flex;
  flex-direction: column;
}

.map-home-img {
  display: block;
  width: 100%;
  flex: 1;
  min-height: 0;
  object-fit: cover;
  object-position: 50% 42%;
  user-select: none;
  pointer-events: none;
}

.map-markers {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: var(--map-dock-h, 82px);
  pointer-events: none;
}

.map-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  width: clamp(36px, 5.5vw, 48px);
  height: clamp(36px, 5.5vw, 48px);
  padding: 0;
  border: none;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ff6b6b 0%, #c92a2a 45%, #862e2e 100%);
  box-shadow:
    0 0 0 3px rgba(255, 255, 255, 0.95),
    0 4px 14px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover,
  &:focus-visible {
    transform: translate(-50%, -50%) scale(1.12);
    box-shadow:
      0 0 0 4px #fff,
      0 0 0 6px rgba(201, 42, 42, 0.5),
      0 6px 18px rgba(0, 0, 0, 0.5);
    outline: none;
  }

  &:active {
    transform: translate(-50%, -50%) scale(1.02);
  }
}

.map-marker--featured {
  width: clamp(46px, 6.8vw, 58px);
  height: clamp(46px, 6.8vw, 58px);
  border-radius: 0;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: conic-gradient(
    from 210deg at 50% 45%,
    #5a8fb8 0deg,
    #2d5570 120deg,
    #1a3a52 240deg,
    #4a7a9e 360deg
  );
  box-shadow:
    0 0 0 3px rgba(212, 174, 58, 0.95),
    0 0 0 6px rgba(26, 58, 82, 0.45),
    0 5px 18px rgba(0, 0, 0, 0.5);
  animation: map-marker-featured-glow 2.6s ease-in-out infinite;

  &:hover,
  &:focus-visible {
    transform: translate(-50%, -50%) scale(1.1);
    box-shadow:
      0 0 0 4px #fff,
      0 0 0 7px rgba(212, 174, 58, 0.65),
      0 0 14px rgba(90, 143, 184, 0.55),
      0 6px 22px rgba(0, 0, 0, 0.55);
    outline: none;
  }

  &:active {
    transform: translate(-50%, -50%) scale(1.03);
  }

  .map-marker-code {
    font-size: clamp(0.58rem, 1.45vw, 0.72rem);
    text-shadow:
      0 0 6px rgba(212, 174, 58, 0.9),
      0 1px 2px rgba(0, 0, 0, 0.7);
  }

  .map-marker-label {
    background: linear-gradient(135deg, rgba(26, 58, 82, 0.96) 0%, rgba(45, 85, 112, 0.96) 100%);
    border-color: rgba(212, 174, 58, 0.55);
    box-shadow:
      0 0 0 1px rgba(212, 174, 58, 0.25),
      0 3px 12px rgba(0, 0, 0, 0.4);
  }
}

@keyframes map-marker-featured-glow {
  0%,
  100% {
    filter: drop-shadow(0 0 3px rgba(212, 174, 58, 0.35));
  }
  50% {
    filter: drop-shadow(0 0 12px rgba(212, 174, 58, 0.85));
  }
}

@media (prefers-reduced-motion: reduce) {
  .map-marker--featured {
    animation: none;
  }
}

.map-marker-code {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: clamp(0.65rem, 1.8vw, 0.78rem);
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  line-height: 1;
}

.map-marker-label {
  position: absolute;
  left: 50%;
  top: calc(100% + 6px);
  transform: translateX(-50%);
  white-space: nowrap;
  max-width: min(44vw, 200px);
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 4px 8px;
  font-size: clamp(0.68rem, 1.6vw, 0.8rem);
  font-weight: 600;
  color: #fff;
  background: rgba(20, 35, 32, 0.88);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

@media (max-width: 600px) {
  .map-marker-label {
    display: none;
  }
}

.map-home-actions--dock {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 6;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px 10px;
  background: linear-gradient(
    180deg,
    rgba(15, 23, 20, 0) 0%,
    rgba(15, 23, 20, 0.55) 28%,
    rgba(18, 32, 28, 0.94) 100%
  );
  border-top: 1px solid rgba(90, 155, 138, 0.35);
  pointer-events: none;
}

.map-home-actions--dock .map-home-btn {
  pointer-events: auto;
  flex: 0 0 auto;
  min-height: 38px;
  padding: 6px 32px;
  text-align: center;
  line-height: 1.25;
  white-space: nowrap;
  font-size: clamp(0.76rem, 1.55vw, 0.9rem);
  letter-spacing: 0.06em;
}

.map-home-btn--pano,
.map-home-btn--coffin {
  min-width: 10rem;
}

.map-home-btn--ear {
  background: linear-gradient(180deg, #5a8fb8 0%, #2d5570 100%);
  border-color: rgba(255, 255, 255, 0.35);
  color: #fffef9;
  letter-spacing: 0.04em;
  white-space: normal;
  min-width: 10.5rem;
  max-width: 11.5rem;
}

.map-home-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 700;
  text-decoration: none;
  font-family: 'STKaiti', 'KaiTi', 'SimSun', 'Noto Serif SC', serif;
  border: 2px solid transparent;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.12s ease, box-shadow 0.12s ease;

  &:active {
    transform: scale(0.98);
  }
}

.map-home-btn--pano {
  background: linear-gradient(180deg, #6a9e8f 0%, #3d6b62 100%);
  border-color: rgba(255, 255, 255, 0.35);
  color: #fffef9;
}

.map-home-btn--coffin {
  background: linear-gradient(180deg, #d4ae3a 0%, #9a7200 100%);
  border-color: rgba(255, 255, 255, 0.35);
  color: #fffef9;
}

@media (max-width: 380px) {
  .map-stage {
    --map-dock-h: 96px;
  }

  .map-home-actions--dock {
    gap: 6px;
    padding: 6px 8px 8px;
  }

  .map-home-actions--dock .map-home-btn {
    min-height: 34px;
    padding: 5px 14px;
    font-size: 0.72rem;
    letter-spacing: 0.03em;
  }

  .map-home-btn--pano,
  .map-home-btn--coffin {
    min-width: 7.5rem;
  }

  .map-home-btn--ear {
    min-width: 8rem;
    max-width: 9rem;
  }
}
</style>
