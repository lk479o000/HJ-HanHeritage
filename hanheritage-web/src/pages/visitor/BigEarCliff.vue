<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  document.title = '大耳朵崖墓群'
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
            <img
              src="/prototype/assets/hejiang-han-cliff-distribution.png"
              alt="大耳朵崖墓群区位与分布示意"
              loading="lazy"
              decoding="async"
            />
            <figcaption class="muted">图：大耳朵崖墓群区位与分布示意</figcaption>
          </figure>
          <p class="muted" style="margin: 10px 0 0; font-size: 0.92rem">
            大耳朵崖墓群位于合江县崖墓文化带核心区，本页整合<strong>崖墓群实景三维</strong>与<strong>关联石棺模型</strong>。三维模型与实景照片补充后可在此查看。
          </p>
          <h3>石棺入口</h3>
          <div class="btn-row gf-model-switch" style="margin-top: 8px">
            <router-link class="btn-touch" :to="{ name: 'coffin', params: { id: 1 }, query: { from: 'ear' } }">石棺 1</router-link>
            <router-link class="btn-touch" :to="{ name: 'coffin', params: { id: 2 }, query: { from: 'ear' } }">石棺 2</router-link>
          </div>
        </aside>

        <section style="display: flex; flex-direction: column; min-height: 0">
          <div class="cliff-model-empty">
            <p>该崖墓群三维模型待补充</p>
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
.cliff-model-empty {
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
