<script setup lang="ts">
import { onMounted } from 'vue'
import { useDiffStore } from './stores/diff'
import InputView from './views/InputView.vue'
import ResultView from './views/ResultView.vue'
import UpdateSWDialog from './components/UpdateSWDialog.vue'
import HeaderActions from './components/HeaderActions.vue'
import { getElColorPrimary, handleThemeStyle } from './utils/theme'

const store = useDiffStore()

onMounted(() => {
  const primaryColor = getElColorPrimary()
  handleThemeStyle(primaryColor)
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <span class="brand-logo">
        <img src="/favicon.svg" alt="logo" width="24" height="24" />
      </span>
      <span class="brand-name">hias-diff</span>
      <span class="spacer" />
      <HeaderActions />
    </header>
    <main class="app-main">
      <InputView v-if="store.screen === 'input'" />
      <ResultView v-else />
    </main>
    <!-- 检测更新 -->
    <UpdateSWDialog />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
.brand-logo {
}
.brand-name {
  font-size: 17px;
  font-weight: 700;
}

.brand-slogan {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.app-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
