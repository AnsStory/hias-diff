<script setup lang="ts">
import { onMounted } from 'vue'
import { useDiffStore } from './stores/diff'
import InputView from './views/InputView.vue'
import ResultView from './views/ResultView.vue'
import UpdateSWDialog from './components/UpdateSWDialog.vue'
import HeaderActions from './components/HeaderActions.vue'
import { getElColorPrimary, handleThemeStyle } from './utils/theme'

const store = useDiffStore()
const handleHeaderClick = () => {
  store.screen = 'input'
  store.reset()
}

onMounted(() => {
  const primaryColor = getElColorPrimary()
  handleThemeStyle(primaryColor)
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <HeaderTitle @click="handleHeaderClick" />
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
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.app-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
