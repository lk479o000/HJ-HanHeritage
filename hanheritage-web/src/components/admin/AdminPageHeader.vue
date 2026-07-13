<script setup lang="ts">
defineProps<{
  title: string
  crumbs: string[]
}>()
</script>

<template>
  <div class="admin-page-header">
    <h1 class="admin-page-title">{{ title }}</h1>
    <nav class="admin-breadcrumb" aria-label="面包屑">
      <span v-for="(crumb, i) in crumbs" :key="i">
        <span v-if="i > 0" class="crumb-sep">/</span>
        <span :class="{ 'crumb-current': i === crumbs.length - 1 }">{{ crumb }}</span>
      </span>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.admin-page-header {
  margin-bottom: 16px;
}

.admin-page-title {
  margin: 0 0 8px;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--admin-text);
}

.admin-breadcrumb {
  font-size: 0.82rem;
  color: var(--admin-muted);
}

.crumb-sep {
  margin: 0 6px;
  color: var(--admin-border);
}

.crumb-current {
  color: var(--admin-primary);
  font-weight: 500;
}
</style>
