<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { RenderLine } from '../core/render'
import { segmentLine, type Segment, type TokenSpan } from '../core/highlight/segment'

const props = withDefaults(
  defineProps<{
    lines: RenderLine[]
    tokens?: { left: TokenSpan[][] | null; right: TokenSpan[][] | null }
    /** 统一视图：双行号栏 + 符号列 */
    unified?: boolean
  }>(),
  { tokens: undefined, unified: false }
)

const emit = defineEmits<{
  scroll: [top: number]
  changeDblclick: [sourceRow: number]
}>()

const ROW_HEIGHT = 24
const BUFFER = 10

const container = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const viewportHeight = ref(600)
let resizeObserver: ResizeObserver | null = null

const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - BUFFER)
)
const endIndex = computed(() =>
  Math.min(
    props.lines.length,
    Math.ceil((scrollTop.value + viewportHeight.value) / ROW_HEIGHT) + BUFFER
  )
)
const visibleLines = computed(() => props.lines.slice(startIndex.value, endIndex.value))

/** 悬停复制：一个连续变更块（本侧有实际文本的行） */
interface CopyBlock {
  id: number
  startPos: number
  endPos: number
  text: string
}

const hoveredBlock = ref(-1)
const copiedBlock = ref(-1)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const blocks = computed<CopyBlock[]>(() => {
  const arr = props.lines
  const res: CopyBlock[] = []
  let i = 0
  while (i < arr.length) {
    if (arr[i].kind === 'unchanged') {
      i++
      continue
    }
    let j = i
    const texts: string[] = []
    while (j < arr.length && arr[j].kind !== 'unchanged') {
      if (arr[j].kind !== 'empty') texts.push(arr[j].text)
      j++
    }
    // 该变更块在本侧全是占位空行时不出现复制按钮
    if (texts.length) res.push({ id: res.length, startPos: i, endPos: j, text: texts.join('\n') })
    i = j
  }
  return res
})

const posToBlock = computed<number[]>(() => {
  const map = new Array<number>(props.lines.length).fill(-1)
  for (const b of blocks.value) {
    for (let p = b.startPos; p < b.endPos; p++) map[p] = b.id
  }
  return map
})

const hoveredBlockData = computed(
  () => blocks.value.find((b) => b.id === hoveredBlock.value) ?? null
)

/** 复制按钮纵向位置：钉在块内、随滚动保持可见 */
const copyBtnTop = computed(() => {
  const b = hoveredBlockData.value
  if (!b) return 0
  const min = b.startPos * ROW_HEIGHT
  const max = Math.max(min, b.endPos * ROW_HEIGHT - ROW_HEIGHT)
  return Math.min(Math.max(scrollTop.value + 4, min), max)
})

async function copyBlock(block: CopyBlock): Promise<void> {
  try {
    await navigator.clipboard.writeText(block.text)
  } catch {
    return
  }
  copiedBlock.value = block.id
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copiedBlock.value = -1
  }, 1200)
}

function onScroll(): void {
  const el = container.value
  if (!el) return
  scrollTop.value = el.scrollTop
  emit('scroll', el.scrollTop)
}

function setScrollTop(top: number): void {
  const el = container.value
  if (el && Math.abs(el.scrollTop - top) > 1) el.scrollTop = top
}

function scrollToIndex(index: number): void {
  container.value?.scrollTo({ top: Math.max(0, index * ROW_HEIGHT - viewportHeight.value / 3) })
}

defineExpose({ setScrollTop, scrollToIndex })

function segmentsFor(line: RenderLine): Segment[] {
  const tokenLines = line.side === 'left' ? props.tokens?.left : props.tokens?.right
  const lineTokens =
    line.syntaxLine !== null && tokenLines ? (tokenLines[line.syntaxLine] ?? null) : null
  return segmentLine(line.text, lineTokens, line.ranges)
}

onMounted(() => {
  const el = container.value
  if (!el) return
  viewportHeight.value = el.clientHeight
  resizeObserver = new ResizeObserver(() => {
    viewportHeight.value = el.clientHeight
  })
  resizeObserver.observe(el)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (copyTimer) clearTimeout(copyTimer)
})
</script>

<template>
  <div ref="container" class="diff-pane" @scroll="onScroll" @mouseleave="hoveredBlock = -1">
    <div class="diff-spacer" :style="{ height: lines.length * ROW_HEIGHT + 'px' }">
      <el-button
        v-if="hoveredBlockData"
        class="copy-block-btn"
        size="small"
        :style="{ top: copyBtnTop + 'px' }"
        @click="copyBlock(hoveredBlockData)"
      >
        {{ copiedBlock === hoveredBlockData.id ? '已复制' : '复制' }}
      </el-button>
      <div class="diff-window" :style="{ transform: `translateY(${startIndex * ROW_HEIGHT}px)` }">
        <div
          v-for="(line, i) in visibleLines"
          :key="line.key"
          class="diff-row"
          :class="'kind-' + line.kind"
          @mouseenter="hoveredBlock = posToBlock[startIndex + i]"
          @dblclick="line.kind !== 'unchanged' && emit('changeDblclick', line.sourceRow)"
        >
          <span class="gutter">{{ line.gutter1 ?? '' }}</span>
          <span v-if="unified" class="gutter">{{ line.gutter2 ?? '' }}</span>
          <span v-if="unified" class="sign">{{ line.sign }}</span>
          <span class="code">
            <template v-for="(seg, i) in segmentsFor(line)" :key="i">
              <span
                :class="{ emphasized: seg.emphasized }"
                :style="seg.color ? { color: seg.color } : undefined"
                >{{ seg.text }}</span
              >
            </template>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diff-pane {
  flex: 1;
  min-width: 0;
  overflow: auto;
  background: var(--color-surface);
  font-family: var(--font-mono);
  font-size: 13px;
}

.diff-spacer {
  position: relative;
  min-width: 100%;
  width: max-content;
}

/* 复制按钮：绝对定位交给此 class，外观由 el-button 负责 */
.copy-block-btn {
  position: absolute;
  right: 12px;
  z-index: 3;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
}

.diff-window {
  position: absolute;
  top: 0;
  left: 0;
  min-width: 100%;
  width: max-content;
}
</style>
