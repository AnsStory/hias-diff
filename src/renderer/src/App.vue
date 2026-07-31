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

const linkMap = {
  win: 'https://github.com/hias-diff/releases/download/v0.1.0/hias-diff-0.1.0-win-x64.zip',
  mac: 'https://github.com/hias-diff/releases/download/v0.1.0/hias-diff-0.1.0-mac-x64.zip',
  linux: 'https://github.com/hias-diff/releases/download/v0.1.0/hias-diff-0.1.0-linux-x64.zip'
}

const downloadPlatform = [
  { label: 'Windows', value: 'win' },
  { label: 'MacOS', value: 'mac' },
  { label: 'Linux', value: 'linux' }
]
const handleCommand = (command: string | number | object) => {
  const url = linkMap[command as keyof typeof linkMap]
  if (url) window.open(url, '_blank')
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
      <el-button
        class="theme-toggle"
        circle
        :icon="isDark() ? Sunny : Moon"
        :title="isDark() ? '切换为亮色' : '切换为暗色'"
        @click="toggleTheme"
      />
      <el-dropdown v-if="!isElectron" @command="handleCommand" trigger="click">
        <el-button :icon="Download" circle />
        <template #dropdown>
          <el-dropdown-menu>
            <template v-for="(item, index) in downloadPlatform" :key="index">
              <el-dropdown-item :command="item.value">{{ item.label }}</el-dropdown-item>
            </template>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
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
