<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Download, Monitor, Moon, Sunny } from '@element-plus/icons-vue'
import { useTheme } from '../composables/useTheme'
import { usePwaStore } from '../stores/pwa'

const isElectron = navigator.userAgent.includes('Electron')
const { isDark, toggleTheme } = useTheme()
const pwa = usePwaStore()

const handleDownload = () => {
  window.open('https://github.com/AnsStory/hias-diff/releases', '_blank')
}

onMounted(() => pwa.init())
onUnmounted(() => pwa.destroy())
</script>

<template>
  <div class="header-actions">
    <el-button
      circle
      :icon="isDark() ? Sunny : Moon"
      :title="isDark() ? '切换为亮色' : '切换为暗色'"
      @click="toggleTheme"
    />
    <!-- <el-button v-if="!isElectron" :icon="Download" circle title="下载" @click="handleDownload" /> -->
    <el-button
      v-if="!isElectron && pwa.canInstall"
      :icon="Monitor"
      circle
      title="安装桌面应用"
      @click="pwa.install"
    />
  </div>
</template>

<style scoped>
.header-actions {
  display: flex;
  align-items: center;
}
</style>
