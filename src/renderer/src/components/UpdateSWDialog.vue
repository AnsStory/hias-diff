<script lang="ts" setup>
import { ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const intervalMS = 60 * 60 * 1000 // 1小时
const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered: (r) => r && setInterval(() => r.update(), intervalMS)
})

const dialogVisible = ref(offlineReady.value || needRefresh.value)

const close = () => {
  offlineReady.value = false
  needRefresh.value = false
  dialogVisible.value = false
}
const confirm = () => {
  updateServiceWorker()
  dialogVisible.value = false
}
</script>

<template>
  <el-dialog v-model="dialogVisible" title="Tips" width="500">
    <div class="message">
      <span v-if="offlineReady"> 应用程序准备离线工作 </span>
      <span v-else> 有新内容可用，点击重新加载按钮以更新。 </span>
    </div>
    <template #footer>
      <div style="text-align: center">
        <el-button v-if="needRefresh" type="primary" @click="confirm"> 确认 </el-button>
        <el-button @click="close">{{ offlineReady ? '关闭' : '取消' }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
