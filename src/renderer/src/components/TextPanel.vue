<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useDiffStore } from '../stores/diff'

const props = defineProps<{
  side: 'left' | 'right'
  title: string
}>()

const emit = defineEmits<{
  scroll: [scrollTop: number]
}>()

const store = useDiffStore()
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function setScrollTop(top: number): void {
  if (textareaRef.value) {
    textareaRef.value.scrollTop = top
  }
}

defineExpose({ setScrollTop })

const text = computed({
  get: () => (props.side === 'left' ? store.leftText : store.rightText),
  set: (value: string) => {
    if (props.side === 'left') store.leftText = value
    else store.rightText = value
  }
})

let syncing = false
function onScroll(): void {
  if (syncing || !textareaRef.value) return
  syncing = true
  emit('scroll', textareaRef.value.scrollTop)
  requestAnimationFrame(() => {
    syncing = false
  })
}

onMounted(() => {
  const el = document.querySelector(`.text-panel[data-side="${props.side}"] textarea`) as HTMLTextAreaElement | null
  if (el) {
    textareaRef.value = el
    el.addEventListener('scroll', onScroll)
  }
})

onUnmounted(() => {
  if (textareaRef.value) {
    textareaRef.value.removeEventListener('scroll', onScroll)
  }
})
</script>

<template>
  <section class="text-panel" :data-side="side">
    <div class="panel-toolbar">
      <span class="panel-title">{{ title }}</span>
      <span class="spacer" />
      <el-button size="small" @click="store.clearSide(side)">清空</el-button>
    </div>
    <el-input
      v-model="text"
      class="panel-input"
      spellcheck="false"
      :placeholder="`在此粘贴${title}…`"
      type="textarea"
    />
  </section>
</template>

<style scoped>
.text-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.panel-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
}

.panel-title {
  font-weight: 600;
}

.panel-input {
  flex: 1;
  min-height: 0;
  padding: 10px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  border: none;
  outline: none;
  resize: none;
  white-space: pre;
}
:deep(.panel-input textarea) {
  height: 100%;
  background: var(--color-surface);
  color: var(--color-text);
}
:deep(.panel-input textarea::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}
:deep(.panel-input textarea::-webkit-scrollbar-track) {
  background: transparent;
}
:deep(.panel-input textarea::-webkit-scrollbar-thumb) {
  background: var(--color-border);
  border-radius: 4px;
}
:deep(.panel-input textarea::-webkit-scrollbar-thumb:hover) {
  background: var(--color-text-secondary);
}
</style>
