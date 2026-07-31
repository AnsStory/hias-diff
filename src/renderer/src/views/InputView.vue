<script setup lang="ts">
import { useDiffStore } from '../stores/diff'
import TextPanel from '../components/TextPanel.vue'

const store = useDiffStore()
</script>

<template>
  <div class="input-view">
    <div class="panels">
      <TextPanel side="left" title="原始文本" />
      <TextPanel side="right" title="更改后文本" />
    </div>
    <div class="actions">
      <el-button :disabled="!store.leftText && !store.rightText" @click="store.clearAll()">
        一键清空
      </el-button>
      <el-button
        type="success"
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
