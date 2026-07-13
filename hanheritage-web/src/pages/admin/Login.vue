<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { defaultNotices, scopeText, fmtDate } from '@/data/admin-store'
import type { Notice } from '@/data/admin-store'
import { login, getUserInfo } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const username = ref('')
const password = ref('')
const loading = ref(false)
const notices = ref<Notice[]>([])

onMounted(() => {
  notices.value = defaultNotices.filter(n => n.status === 'published').sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))
})

async function handleLogin() {
  const account = username.value.trim()
  const pwd = password.value
  if (!account || !pwd) {
    ElMessage.warning('请输入账号和密码')
    return
  }

  loading.value = true
  try {
    const result = await login({ username: account, password: pwd })
    userStore.setToken(result.token)
    if (result.refreshToken) {
      userStore.setRefreshToken(result.refreshToken)
    }
    const info = await getUserInfo()
    userStore.setUserInfo(info as Record<string, unknown>)

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    const target =
      redirect && redirect.startsWith('/admin') && redirect !== '/admin/login'
        ? redirect
        : '/admin/dashboard'
    await router.replace(target)
  } catch (err: unknown) {
    const axiosErr = err as { response?: unknown }
    if (!axiosErr.response) {
      ElMessage.error(err instanceof Error ? err.message : '登录失败')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <aside class="login-hero">
      <div class="login-hero__texture"></div>
      <div class="login-hero__vignette"></div>
      <div class="login-hero__content">
        <div class="login-hero__seal">
          <svg viewBox="0 0 120 120" width="72" height="72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="12" y="12" width="96" height="96" rx="4" stroke="currentColor" stroke-width="2.2" opacity="0.85" />
            <rect x="28" y="28" width="64" height="64" rx="2" stroke="currentColor" stroke-width="1.4" opacity="0.55" />
            <path d="M60 38v44M38 60h44" stroke="currentColor" stroke-width="1.2" opacity="0.35" />
          </svg>
        </div>
        <p class="login-hero__eyebrow">文物数字化馆藏 · 合江汉代画像石棺</p>
        <h2 class="login-hero__headline">数字化保护与展示利用</h2>
        <p class="login-hero__rule"><span>馆藏管理</span></p>
      </div>
    </aside>

    <main class="login-main">
      <div class="login-card">
        <header class="login-card__head">
          <p class="login-card__kicker">内部管理</p>
          <h1 class="login-card__title">可视化管理系统</h1>
          <div class="login-card__rule"></div>
        </header>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="login-field">
            <label class="login-field__label" for="u">账号</label>
            <div class="login-input-wrap">
              <span class="login-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input class="login-input" id="u" v-model="username" type="text" placeholder="请输入用户名" autocomplete="username" />
            </div>
          </div>
          <div class="login-field">
            <label class="login-field__label" for="p">密码</label>
            <div class="login-input-wrap">
              <span class="login-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input class="login-input" id="p" v-model="password" type="password" placeholder="请输入密码" autocomplete="current-password" />
            </div>
          </div>
          <button type="submit" class="login-submit" :disabled="loading">
            {{ loading ? '登录中…' : '进入管理后台' }}
          </button>
        </form>

        <section class="sys-login-notices" v-if="notices.length">
          <h2>系统公告</h2>
          <ul class="sys-login-notice-list">
            <li v-for="n in notices" :key="n.id">
              <div class="sys-nt-title">{{ n.title }}</div>
              <div class="sys-nt-meta">发布于 {{ fmtDate(n.publishedAt!) }} · {{ scopeText(n.scope) }}</div>
              <div class="sys-nt-body" v-html="n.contentHtml"></div>
            </li>
          </ul>
        </section>
        <p v-else class="sys-login-notices-empty">暂无已发布公告</p>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  --museum-ink: #{$museum-ink};
  --museum-ink-soft: #{$museum-ink-soft};
  --museum-muted: #{$museum-muted};
  --museum-paper: #{$museum-paper};
  --museum-paper-shade: #{$museum-paper-shade};
  --museum-gold: #{$museum-gold};
  --museum-gold-dim: #{$museum-gold-dim};
  --museum-bronze: #{$museum-bronze};
  --museum-border: #{$museum-border};
  --museum-wine: #{$museum-wine};
  --museum-wine-deep: #{$museum-wine-deep};
  --museum-stone: #{$museum-stone};
  --museum-serif: #{$museum-serif};

  min-height: 100dvh;
  display: grid;
  background-color: $museum-stone;
  background-image:
    linear-gradient(165deg, rgba(42, 32, 24, 0.55) 0%, transparent 45%),
    radial-gradient(ellipse 90% 55% at 50% -10%, rgba(201, 166, 107, 0.12), transparent 55%),
    linear-gradient(180deg, #1f1a15 0%, #12100d 100%);
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #2c2419;
}

.login-hero {
  display: none;
  position: relative;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  padding: clamp(36px, 7vw, 72px);
}

.login-hero__texture {
  position: absolute;
  inset: 0;
  opacity: 0.4;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.11'/%3E%3C/svg%3E");
  pointer-events: none;
}

.login-hero__vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 75% 65% at 50% 45%, transparent 30%, rgba(0, 0, 0, 0.45) 100%);
  pointer-events: none;
}

.login-hero__content {
  position: relative;
  z-index: 1;
  max-width: 400px;
  text-align: center;
}

.login-hero__seal {
  margin: 0 auto 22px;
  color: $museum-gold;
  filter: drop-shadow(0 2px 12px rgba(201, 166, 107, 0.25));
}

.login-hero__eyebrow {
  margin: 0 0 14px;
  font-family: $museum-serif;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.28em;
  color: rgba(232, 220, 198, 0.88);
}

.login-hero__headline {
  margin: 0 0 16px;
  font-family: $museum-serif;
  font-size: clamp(1.45rem, 2.4vw, 1.75rem);
  font-weight: 700;
  line-height: 1.45;
  color: #f5efe4;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.35);
}

.login-hero__rule {
  margin: 0 0 18px;
  font-size: 0.72rem;
  letter-spacing: 0.35em;
  color: $museum-gold;

  span { padding: 0 0.5em; }

  &::before, &::after {
    content: "";
    display: inline-block;
    width: 36px;
    height: 1px;
    background: linear-gradient(90deg, transparent, $museum-gold-dim, transparent);
    vertical-align: middle;
    margin: 0 6px;
  }
}

.login-main {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(22px, 5vw, 48px) clamp(18px, 4vw, 36px);
  min-height: 100dvh;
  background: linear-gradient(180deg, rgba(26, 22, 18, 0.65) 0%, rgba(18, 15, 12, 0.9) 100%);
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 34px 32px 30px;
  background: $museum-paper;
  background-image: linear-gradient(180deg, #fdfbf7 0%, $museum-paper-shade 100%);
  border: 1px solid $museum-border;
  border-radius: 2px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.65),
    0 1px 0 rgba(139, 105, 20, 0.12),
    0 28px 56px -16px rgba(20, 17, 14, 0.45);

  &::before {
    content: "";
    position: absolute;
    top: 10px; left: 10px; right: 10px; bottom: 10px;
    border: 1px solid rgba(139, 105, 20, 0.12);
    pointer-events: none;
    border-radius: 1px;
  }
}

.login-card__head {
  position: relative;
  margin-bottom: 26px;
  text-align: center;
}

.login-card__kicker {
  margin: 0 0 8px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.42em;
  color: $museum-bronze;
}

.login-card__title {
  margin: 0 0 14px;
  font-family: $museum-serif;
  font-size: 1.42rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: $museum-ink;
}

.login-card__rule {
  width: 120px;
  height: 2px;
  margin: 0 auto;
  background: linear-gradient(90deg, transparent, $museum-gold 20%, $museum-gold 80%, transparent);
  opacity: 0.85;
}

.login-form {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-field__label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: $museum-ink-soft;
}

.login-input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  min-height: 48px;
  background: #fffcf7;
  border: 1px solid #c9b8a4;
  border-radius: 2px;
  box-shadow: inset 0 1px 2px rgba(44, 36, 25, 0.06);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;

  &:focus-within {
    border-color: $museum-bronze;
    box-shadow: inset 0 1px 2px rgba(44, 36, 25, 0.05), 0 0 0 2px rgba(201, 166, 107, 0.35);
  }
}

.login-input-icon {
  flex-shrink: 0;
  display: flex;
  color: $museum-bronze;
  opacity: 0.75;

  .login-input-wrap:focus-within & {
    opacity: 1;
    color: #6b4c0a;
  }
}

.login-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 0.95rem;
  color: $museum-ink;
  outline: none;
  padding: 11px 0;

  &::placeholder { color: #9a8b7c; }
}

.login-submit {
  width: 100%;
  margin-top: 6px;
  min-height: 50px;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: #faf6ef;
  background: linear-gradient(180deg, #6e3a2e 0%, $museum-wine 48%, $museum-wine-deep 100%);
  border: 1px solid #3d1a14;
  border-radius: 2px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 14px rgba(60, 30, 24, 0.35);
  cursor: pointer;
  transition: transform 0.14s ease, box-shadow 0.14s ease, filter 0.14s ease;

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 8px 22px rgba(60, 30, 24, 0.42);
  }

  &:active {
    transform: translateY(0);
    filter: brightness(0.98);
  }

  &:disabled {
    opacity: 0.72;
    cursor: not-allowed;
    transform: none;
    filter: none;
  }
}

.sys-login-notices {
  margin-top: 26px;
  padding-top: 20px;
  border-top: 1px solid rgba(139, 105, 20, 0.2);

  h2 {
    font-family: $museum-serif;
    font-size: 0.88rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    color: $museum-ink-soft;
    margin: 0 0 12px;
  }
}

.sys-login-notice-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
  max-height: min(220px, 32vh);
  overflow-y: auto;

  li {
    padding: 10px 12px;
    border: 1px solid #cdc0ae;
    border-radius: 8px;
    background: rgba(255, 252, 247, 0.95);
  }
}

.sys-nt-title { font-weight: 700; color: $museum-ink; margin-bottom: 4px; }
.sys-nt-meta { font-size: 0.78rem; color: $museum-muted; margin-bottom: 6px; }
.sys-nt-body { font-size: 0.88rem; color: #334155; line-height: 1.6; }
.sys-login-notices-empty { color: $museum-muted; text-align: center; padding: 16px 0; font-size: 0.88rem; }

@media (min-width: 960px) {
  .login-page {
    grid-template-columns: minmax(260px, min(34vw, 380px)) minmax(420px, 1fr);
  }
  .login-hero { display: flex; justify-content: center; }
  .login-hero__content { text-align: left; max-width: 320px; }
  .login-hero__seal { margin: 0 0 24px; }
  .login-hero__rule { text-align: left; &::before { width: 28px; margin-left: 0; } }
  .login-main {
    min-height: 100dvh;
    background: linear-gradient(135deg, #ebe4d8 0%, #e5ddd0 40%, #ddd4c4 100%);
    padding: 40px 36px;
  }
}
</style>
