<script setup lang="ts">
import { onMounted } from 'vue'
import { Download, Moon, Sunny } from '@element-plus/icons-vue'
import { useDiffStore } from './stores/diff'
import { useTheme } from './composables/useTheme'
import InputView from './views/InputView.vue'
import ResultView from './views/ResultView.vue'

const store = useDiffStore()
const { isDark, toggleTheme } = useTheme()

const isElectron = navigator.userAgent.includes('Electron')

const url = 'https://github.com/AnsStory/hias-diff/releases'
const handleDownload = () => {
  window.open(url, '_blank')
}

onMounted(() => {
  window.api?.onNewDiff(() => store.reset())
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <span class="brand-name">hias-diff</span>
      <span class="spacer" />
      <div>
        <el-button
          class="theme-toggle"
          circle
          :icon="isDark() ? Sunny : Moon"
          :title="isDark() ? '切换为亮色' : '切换为暗色'"
          @click="toggleTheme"
        />
        <el-button
          v-if="!isElectron"
          :icon="Download"
          circle
          title="下载"
          @click="handleDownload"
        />
      </div>
    </header>
    <main class="app-main">
      <InputView v-if="store.screen === 'input'" />
      <ResultView v-else />
    </main>
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
