<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { MAX_FILE_SIZE, useDiffStore } from '../stores/diff'
import { decodeBytes, looksBinary } from '@shared/encoding'

const props = defineProps<{
  side: 'left' | 'right'
  title: string
}>()

const emit = defineEmits<{
  scroll: [scrollTop: number]
}>()

const store = useDiffStore()
const dragging = ref(false)
const errorMsg = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
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

const fileName = computed(() => (props.side === 'left' ? store.leftFileName : store.rightFileName))

const ERROR_TEXT: Record<string, string> = {
  binary: '不支持二进制文件',
  'too-large': '文件过大（超过 20MB）',
  'read-failed': '文件读取失败'
}

async function openFile(): Promise<void> {
  errorMsg.value = ''
  // Electron 环境走原生文件对话框；浏览器（dev:web）回退到网页文件选择器
  if (window.api?.openFile) {
    const result = await window.api.openFile()
    if (!result) return
    if (result.error) {
      errorMsg.value = ERROR_TEXT[result.error] ?? '文件读取失败'
      return
    }
    store.setFile(props.side, result.name, result.content ?? '')
    return
  }
  fileInput.value?.click()
}

/** 读取并校验单个文件，拖拽与网页文件选择器共用 */
async function loadFile(file: File): Promise<void> {
  errorMsg.value = ''
  if (file.size > MAX_FILE_SIZE) {
    errorMsg.value = ERROR_TEXT['too-large']
    return
  }
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (looksBinary(bytes)) {
      errorMsg.value = ERROR_TEXT['binary']
      return
    }
    // 自动识别编码并转码（UTF-8 / GBK / Big5 等）
    store.setFile(props.side, file.name, decodeBytes(bytes).text)
  } catch {
    errorMsg.value = ERROR_TEXT['read-failed']
  }
}

async function onFileInputChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await loadFile(file)
  // 清空以便再次选择同一文件也能触发 change
  input.value = ''
}

async function onDrop(event: DragEvent): Promise<void> {
  dragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) await loadFile(file)
}

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
  // 获取 el-input 内部的 textarea 元素
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
  <section
    class="text-panel"
    :class="{ dragging }"
    :data-side="side"
    @dragover.prevent="dragging = true"
    @dragleave="dragging = false"
    @drop.prevent="onDrop"
  >
    <div class="panel-toolbar">
      <span class="panel-title">{{ title }}</span>
      <span v-if="fileName" class="panel-file" :title="fileName">{{ fileName }}</span>
      <el-text v-if="errorMsg" type="danger" size="small">{{ errorMsg }}</el-text>
      <span class="spacer" />
      <el-button size="small" @click="openFile">打开文件</el-button>
      <el-button size="small" @click="store.clearSide(side)">清空</el-button>
      <input ref="fileInput" type="file" class="file-input-hidden" @change="onFileInputChange" />
    </div>
    <el-input
      v-model="text"
      class="panel-input"
      spellcheck="false"
      :placeholder="`在此粘贴${title}，或将文件拖入此区域…`"
      type="textarea"
    />
    <!-- <textarea
      v-model="text"
      class="panel-input"
      spellcheck="false"
      :placeholder="`在此粘贴${title}，或将文件拖入此区域…`"
    /> -->
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

.text-panel.dragging {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(31, 136, 61, 0.25);
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

.file-input-hidden {
  display: none;
}

.panel-file {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--color-text-secondary);
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
  /* height: 100% !important; */
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
