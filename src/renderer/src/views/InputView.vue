<script setup lang="ts">
import { ref } from 'vue'
import { useDiffStore } from '../stores/diff'
import TextPanel from '../components/TextPanel.vue'

const store = useDiffStore()

const leftPane = ref<InstanceType<typeof TextPanel> | null>(null)
const rightPane = ref<InstanceType<typeof TextPanel> | null>(null)

let syncing = false
function syncScroll(from: 'left' | 'right', top: number): void {
  if (syncing) return
  syncing = true
  const target = from === 'left' ? rightPane.value : leftPane.value
  target?.setScrollTop(top)
  requestAnimationFrame(() => {
    syncing = false
  })
}
</script>

<template>
  <div class="input-view">
    <div class="panels">
      <TextPanel
        ref="leftPane"
        side="left"
        title="原始文本"
        @scroll="(top) => syncScroll('left', top)"
      />
      <TextPanel
        ref="rightPane"
        side="right"
        title="更改后文本"
        @scroll="(top) => syncScroll('right', top)"
      />
    </div>
    <div class="actions">
      <el-button :disabled="!store.leftText && !store.rightText" @click="store.clearAll()">
        一键清空
      </el-button>
      <el-button
        type="primary"
        :disabled="!store.leftText && !store.rightText"
        @click="store.runDiff()"
      >
        查找差异
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.input-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.panels {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}
</style>
