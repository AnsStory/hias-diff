<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useDiffStore } from './stores/diff'
import InputView from './views/InputView.vue'
import ResultView from './views/ResultView.vue'
import UpdateSWDialog from './components/UpdateSWDialog.vue'
import HeaderActions from './components/HeaderActions.vue'
import { getElColorPrimary, handleThemeStyle } from './utils/theme'
import { animationMonitor } from './utils/animation'

const store = useDiffStore()
let animationFrameId: number | null = null

const handleHeaderClick = () => {
  store.screen = 'input'
  store.reset()
}

function startPerformanceMonitoring(): void {
  function animate() {
    animationMonitor.measure()
    animationFrameId = requestAnimationFrame(animate)
  }
  animate()
}

function stopPerformanceMonitoring(): void {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

onMounted(() => {
  const primaryColor = getElColorPrimary()
  handleThemeStyle(primaryColor)
  startPerformanceMonitoring()
})

onUnmounted(() => {
  stopPerformanceMonitoring()
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <HeaderTitle @click="handleHeaderClick" />
      <HeaderActions />
    </header>
    <main class="app-main">
      <Transition name="fade" mode="out-in">
        <InputView v-if="store.screen === 'input'" key="input" />
        <ResultView v-else key="result" />
      </Transition>
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
