<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import {
  Back,
  Switch,
  DocumentCopy,
  Filter,
  Top,
  Bottom,
  Close,
  RefreshLeft,
  RefreshRight
} from '@element-plus/icons-vue'
import { useDiffStore } from '../stores/diff'
import DiffPane from '../components/DiffPane.vue'
import { buildUnifiedRows, getDiffBlocks } from '../core/diff/unified'
import type { DiffCell } from '../core/diff/types'
import type { RenderLine } from '../core/render'
import { tokenizeLines } from '../core/highlight/highlighter'
import { segmentLine, type Segment, type TokenSpan } from '../core/highlight/segment'
import { LANGUAGE_OPTIONS } from '../core/highlight/languages'
import { theme } from '../composables/useTheme'
import { getAnimationClass } from '../utils/animation'
import type { ScrollbarInstance } from 'element-plus'

const promptAnimationClass = computed(() => getAnimationClass('lightSpeedInRight'))
const store = useDiffStore()
const popupLeftRef = ref<ScrollbarInstance | null>(null)
const popupRightRef = ref<ScrollbarInstance | null>(null)
const toolbarRef = ref<HTMLElement | null>(null)
const toolbarHeight = ref(0)

const leftPane = ref<InstanceType<typeof DiffPane> | null>(null)
const rightPane = ref<InstanceType<typeof DiffPane> | null>(null)
const unifiedPane = ref<InstanceType<typeof DiffPane> | null>(null)

const tokens = shallowRef<{ left: TokenSpan[][] | null; right: TokenSpan[][] | null }>({
  left: null,
  right: null
})
const currentBlock = ref(-1)
const copied = ref<'left' | 'right' | ''>('')
/** 双击变更块后弹出的“变更操作”浮层是否可见 */
const popupVisible = ref(false)
/** “忽略规则”面板是否展开 */
const ignorePanelVisible = ref(false)
/** 自定义忽略规则输入框的当前值 */
const newRule = ref('')
/** 面板中展示的引号/破折号示例字符 */
const quoteSamples = ['\u2018', '\u2019', '\u201C', '\u201D', "'", '"']
const dashSamples = ['-', '\u2010', '\u2013', '\u2014', '\u2015', '\u2212']
const ROW_HEIGHT = 24
const scrollTop = ref(0)
const scrollLeft = ref(0)
const resultBody = ref<HTMLElement | null>(null)

const result = computed(() => store.result)

function cellToLine(cell: DiffCell, row: number, side: 'left' | 'right'): RenderLine {
  const kind = cell.type === 'modified' ? (side === 'left' ? 'removed' : 'added') : cell.type
  return {
    key: row,
    gutter1: cell.lineNumber,
    text: cell.text,
    kind,
    ranges: cell.ranges,
    syntaxLine: cell.lineNumber !== null ? cell.lineNumber - 1 : null,
    side,
    sourceRow: row
  }
}

const leftLines = computed<RenderLine[]>(
  () => result.value?.rows.map((row) => cellToLine(row.left, row.index, 'left')) ?? []
)
const rightLines = computed<RenderLine[]>(
  () => result.value?.rows.map((row) => cellToLine(row.right, row.index, 'right')) ?? []
)

const unifiedLines = computed<RenderLine[]>(() => {
  if (!result.value) return []
  return buildUnifiedRows(result.value).map((row, i) => ({
    key: i,
    gutter1: row.lineNumberOld,
    gutter2: row.lineNumberNew,
    sign: row.type === 'added' ? '+' : row.type === 'removed' ? '-' : '',
    text: row.text,
    kind: row.type,
    ranges: row.ranges,
    syntaxLine:
      row.type === 'removed'
        ? row.lineNumberOld !== null
          ? row.lineNumberOld - 1
          : null
        : row.lineNumberNew !== null
          ? row.lineNumberNew - 1
          : null,
    side: row.type === 'removed' ? ('left' as const) : ('right' as const),
    sourceRow: row.rowIndex
  }))
})

const blocks = computed(() => (result.value ? getDiffBlocks(result.value) : []))

// 结果变化（互换/重新对比/合并）后修正当前变更索引，必要时关闭浮层
watch(blocks, (list) => {
  if (currentBlock.value >= list.length) currentBlock.value = list.length - 1
  if (!list.length) popupVisible.value = false
})
watch(
  () => store.screen,
  (screen) => {
    if (screen !== 'result') popupVisible.value = false
  }
)

// 当前变更块在渲染行中的起始位置（并排/统一视图的行序不同）
const popupRenderRow = computed(() => {
  if (currentBlock.value < 0 || currentBlock.value >= blocks.value.length) return 0
  const start = blocks.value[currentBlock.value].start
  if (store.viewMode === 'split') return start
  const idx = unifiedLines.value.findIndex((line) => line.sourceRow >= start)
  return idx >= 0 ? idx : 0
})

// 浮层纵向位置
const popupTop = computed(() => {
  const top = popupRenderRow.value * ROW_HEIGHT - scrollTop.value - toolbarHeight.value
  return top
})

// 浮层内展示的当前变更块（并排：左右两列成对；统一：单列）
const popupSplitRows = computed(() => {
  if (!result.value || currentBlock.value < 0 || currentBlock.value >= blocks.value.length)
    return []
  const block = blocks.value[currentBlock.value]
  return result.value.rows.slice(block.start, block.end).map((row) => ({
    key: row.index,
    left: cellToLine(row.left, row.index, 'left'),
    right: cellToLine(row.right, row.index, 'right')
  }))
})
const popupUnifiedLines = computed(() => {
  if (currentBlock.value < 0 || currentBlock.value >= blocks.value.length) return []
  const block = blocks.value[currentBlock.value]
  return unifiedLines.value.filter(
    (line) => line.sourceRow >= block.start && line.sourceRow < block.end
  )
})

// 与 DiffPane 一致的语法高亮 + 差异范围分段
function segmentsFor(line: RenderLine): Segment[] {
  const tokenLines = line.side === 'left' ? tokens.value.left : tokens.value.right
  const lineTokens =
    line.syntaxLine !== null && tokenLines ? (tokenLines[line.syntaxLine] ?? null) : null
  return segmentLine(line.text, lineTokens, line.ranges)
}

async function refreshTokens(): Promise<void> {
  if (store.language === 'plaintext') {
    tokens.value = { left: null, right: null }
    return
  }
  const lang = store.language
  const shikiTheme = theme.value === 'dark' ? 'github-dark' : 'github-light'
  const [left, right] = await Promise.all([
    tokenizeLines(store.leftText, lang, shikiTheme),
    tokenizeLines(store.rightText, lang, shikiTheme)
  ])
  // 语言可能在等待期间被切换，避免过期结果覆盖
  if (store.language === lang) tokens.value = { left, right }
}

watch(() => store.language, refreshTokens, { immediate: true })
// 明暗切换后语法色需随之切换，重新 tokenize
watch(theme, refreshTokens)
let toolbarObserver: ResizeObserver | null = null
onMounted(() => {
  if (toolbarRef.value) {
    toolbarHeight.value = toolbarRef.value.clientHeight
    toolbarObserver = new ResizeObserver(([entry]) => {
      toolbarHeight.value = entry.contentRect.height
    })
    toolbarObserver.observe(toolbarRef.value)
  }
  // 添加键盘快捷键监听
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  toolbarObserver?.disconnect()
  document.removeEventListener('keydown', handleKeydown)
})

/** 键盘快捷键处理 */
function handleKeydown(e: KeyboardEvent): void {
  // Ctrl+Z / Cmd+Z: 撤销
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    store.undo()
  }
  // Ctrl+Y / Cmd+Shift+Z / Ctrl+Shift+Z: 重做
  if (
    ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
    ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
    ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z')
  ) {
    e.preventDefault()
    store.redo()
  }
}

let syncing = false
function syncScroll(from: 'left' | 'right', top: number, left: number): void {
  scrollTop.value = top
  scrollLeft.value = left
  if (syncing) return
  syncing = true
  const target = from === 'left' ? rightPane.value : leftPane.value
  target?.setScrollTop(top)
  target?.setScrollLeft(left)
  requestAnimationFrame(() => {
    syncing = false
  })
}

function popupScroll(from: 'left' | 'right', top: number, left: number): void {
  if (syncing) return
  syncing = true
  const target = from === 'left' ? popupRightRef.value : popupLeftRef.value
  target?.setScrollTop(top)
  target?.setScrollLeft(left)
  requestAnimationFrame(() => {
    syncing = false
  })
}

function scrollToBlock(rowIndex: number): void {
  if (store.viewMode === 'split') {
    leftPane.value?.scrollToIndex(rowIndex)
    rightPane.value?.scrollToIndex(rowIndex)
  } else {
    const unifiedIndex = unifiedLines.value.findIndex((line) => line.sourceRow >= rowIndex)
    if (unifiedIndex >= 0) unifiedPane.value?.scrollToIndex(unifiedIndex)
  }
}

function goTo(delta: number): void {
  const total = blocks.value.length
  if (total === 0) return
  currentBlock.value = (((currentBlock.value + delta) % total) + total) % total
  scrollToBlock(blocks.value[currentBlock.value].start)
}

/** 双击某一变更行：定位到它所属的变更块并弹出操作浮层 */
function onBlockDblClick(sourceRow: number): void {
  const idx = blocks.value.findIndex((b) => sourceRow >= b.start && sourceRow < b.end)
  if (idx < 0) return
  currentBlock.value = idx
  popupVisible.value = true
}

/**
 * 合并当前变更块：
 * - toRight：用左侧此处内容覆盖右侧（左 → 右）
 * - toLeft：用右侧此处内容覆盖左侧（右 → 左）
 * 基于对齐行模型重建两侧文本后重算 diff，合并后自动停留在下一处差异。
 */
function mergeBlock(direction: 'toRight' | 'toLeft'): void {
  const res = result.value
  if (!res || currentBlock.value < 0 || currentBlock.value >= blocks.value.length) return
  const block = blocks.value[currentBlock.value]
  const newLeft: string[] = []
  const newRight: string[] = []
  for (const row of res.rows) {
    const inBlock = row.index >= block.start && row.index < block.end
    const leftSource = inBlock && direction === 'toLeft' ? row.right : row.left
    if (leftSource.type !== 'empty') newLeft.push(leftSource.text)
    const rightSource = inBlock && direction === 'toRight' ? row.left : row.right
    if (rightSource.type !== 'empty') newRight.push(rightSource.text)
  }
  // 保存当前状态到撤销栈
  const directionText = direction === 'toRight' ? '→' : '←'
  store.pushUndoState(`合并变更块 ${currentBlock.value + 1} ${directionText}`)
  store.leftText = newLeft.join('\n')
  store.rightText = newRight.join('\n')
  store.runDiff()
  // watch(blocks) 已修正 currentBlock；若仍有差异则滚动到下一处
  if (currentBlock.value >= 0 && currentBlock.value < blocks.value.length) {
    scrollToBlock(blocks.value[currentBlock.value].start)
  }
}

async function copySide(side: 'left' | 'right'): Promise<void> {
  await navigator.clipboard.writeText(side === 'left' ? store.leftText : store.rightText)
  copied.value = side
  setTimeout(() => {
    copied.value = ''
  }, 1500)
}

/** 添加一条自定义忽略规则（拒绝空白、去重；保留原始首尾空格） */
function addRule(): void {
  const rule = newRule.value
  if (!rule.trim() || store.ignorePatterns.includes(rule)) {
    newRule.value = ''
    return
  }
  store.ignorePatterns.push(rule)
  newRule.value = ''
}

function removeRule(index: number): void {
  store.ignorePatterns.splice(index, 1)
}

/** 应用忽略规则：先提交输入框里未添加的文本，再重算 diff 并关闭面板 */
function applyIgnore(): void {
  if (newRule.value.trim()) addRule()
  store.runDiff()
  ignorePanelVisible.value = false
}
</script>

<template>
  <div class="result-view">
    <div class="result-toolbar" ref="toolbarRef">
      <el-button type="primary" :icon="Back" @click="store.backToInput()" title="重新编辑" />
      <el-button :icon="Switch" @click="store.swapSides()">互换</el-button>
      <el-button
        :icon="RefreshLeft"
        :disabled="!store.canUndo"
        @click="store.undo()"
        title="撤销上一次合并操作 (Ctrl+Z)"
      >
        撤销
      </el-button>
      <el-button
        :icon="RefreshRight"
        :disabled="!store.canRedo"
        @click="store.redo()"
        title="重做被撤销的操作 (Ctrl+Y)"
      >
        重做
      </el-button>
      <el-button :icon="DocumentCopy" @click="copySide('left')">
        {{ copied === 'left' ? '已复制' : '复制左侧' }}
      </el-button>
      <el-button :icon="DocumentCopy" @click="copySide('right')">
        {{ copied === 'right' ? '已复制' : '复制右侧' }}
      </el-button>
      <template v-if="result">
        <el-tag class="m-l-12" v-if="result.identical" type="success" round>
          两段文本完全相同
        </el-tag>
        <template v-else>
          <el-tag type="danger" round class="m-l-12">−{{ result.stats.deletions }} 删除</el-tag>
          <el-tag type="success" round class="m-l-12">+{{ result.stats.additions }} 新增</el-tag>
        </template>
      </template>
      <span class="spacer" />
      <span :class="promptAnimationClass" class="prompt">
        <el-text type="danger">*</el-text>
        双击变更行可查看该变更块内所有差异
      </span>
      <el-select-v2
        style="width: 160px"
        v-model="store.language"
        :options="LANGUAGE_OPTIONS"
        filterable
        class="m-l-12"
      />
      <el-radio-group v-model="store.viewMode" class="m-l-12">
        <el-radio-button value="split">并排</el-radio-button>
        <el-radio-button value="unified">统一</el-radio-button>
      </el-radio-group>
      <el-button
        class="m-l-12"
        :icon="Top"
        :disabled="!blocks.length"
        @click="goTo(-1)"
        title="上一处"
      />
      <el-button :icon="Bottom" :disabled="!blocks.length" @click="goTo(1)" title="下一处" />
      <el-popover
        placement="bottom-end"
        :width="320"
        trigger="click"
        v-model:visible="ignorePanelVisible"
      >
        <template #reference>
          <el-button type="primary" :icon="Filter" class="m-l-12"> </el-button>
        </template>
        <div class="ignore-panel-content">
          <div class="ignore-panel-title">忽略规则:忽略以下差异…</div>
          <el-checkbox v-model="store.ignoreQuotes">引号</el-checkbox>
          <div class="ignore-samples">
            <el-tag
              v-for="(c, i) in quoteSamples"
              :key="'q' + i"
              size="small"
              effect="plain"
              class="sample-chip"
              >{{ c }}</el-tag
            >
          </div>
          <el-checkbox v-model="store.ignoreDashes">破折号</el-checkbox>
          <div class="ignore-samples">
            <el-tag
              v-for="(c, i) in dashSamples"
              :key="'d' + i"
              size="small"
              effect="plain"
              class="sample-chip"
              >{{ c }}</el-tag
            >
          </div>
          <div class="ignore-flags">
            <el-checkbox v-model="store.ignoreTrailingWhitespace">行尾空白</el-checkbox>
            <el-checkbox v-model="store.ignoreCase">大小写</el-checkbox>
          </div>
          <el-divider />
          <div class="ignore-panel-subtitle">自定义忽略规则</div>
          <div v-if="store.ignorePatterns.length" class="rule-chips">
            <el-tag
              v-for="(p, i) in store.ignorePatterns"
              :key="i"
              type="success"
              closable
              @close="removeRule(i)"
              >{{ p }}</el-tag
            >
          </div>
          <el-input
            v-model="newRule"
            placeholder="应忽略的单词、短语或字符"
            @keyup.enter="addRule"
          />
          <div class="ignore-panel-footer">
            <el-button link @click="addRule">⊕ 添加规则</el-button>
            <el-button type="success" @click="applyIgnore">应用更改</el-button>
          </div>
        </div>
      </el-popover>
    </div>

    <div class="result-body" ref="resultBody">
      <div
        v-if="popupVisible && currentBlock >= 0 && blocks.length"
        class="change-popup"
        :style="{ top: popupTop + 'px' }"
        @dblclick.stop
      >
        <div class="change-popup-nav">
          <span class="change-count">更改 {{ currentBlock + 1 }} 的 {{ blocks.length }}</span>
          <div class="nav-btns">
            <el-button size="small" :icon="Top" :disabled="blocks.length < 2" @click="goTo(-1)">
              上一个
            </el-button>
            <el-button size="small" :icon="Bottom" :disabled="blocks.length < 2" @click="goTo(1)">
              下一个
            </el-button>
          </div>
        </div>
        <div class="change-popup-body">
          <div v-if="store.viewMode === 'split'" class="popup-diff split">
            <!-- 单行24超过10行展示滚动条 -->
            <el-scrollbar
              ref="popupLeftRef"
              class="popup-col"
              max-height="240"
              @scroll="({ scrollTop, scrollLeft }) => popupScroll('left', scrollTop, scrollLeft)"
            >
              <div
                v-for="row in popupSplitRows"
                :key="'l' + row.key"
                class="diff-row"
                :class="'kind-' + row.left.kind"
              >
                <span class="gutter">{{ row.left.gutter1 ?? '' }}</span>
                <span class="code">
                  <template v-for="(seg, i) in segmentsFor(row.left)" :key="i">
                    <span
                      :class="{ emphasized: seg.emphasized }"
                      :style="seg.color ? { color: seg.color } : undefined"
                      >{{ seg.text }}</span
                    >
                  </template>
                </span>
              </div>
            </el-scrollbar>
            <!-- 单行24超过10行展示滚动条 -->
            <el-scrollbar
              ref="popupRightRef"
              class="popup-col"
              max-height="240"
              @scroll="({ scrollTop, scrollLeft }) => popupScroll('right', scrollTop, scrollLeft)"
            >
              <div
                v-for="row in popupSplitRows"
                :key="'r' + row.key"
                class="diff-row"
                :class="'kind-' + row.right.kind"
              >
                <span class="gutter">{{ row.right.gutter1 ?? '' }}</span>
                <span class="code">
                  <template v-for="(seg, i) in segmentsFor(row.right)" :key="i">
                    <span
                      :class="{ emphasized: seg.emphasized }"
                      :style="seg.color ? { color: seg.color } : undefined"
                      >{{ seg.text }}</span
                    >
                  </template>
                </span>
              </div>
            </el-scrollbar>
          </div>
          <div v-else class="popup-diff unified">
            <div
              v-for="line in popupUnifiedLines"
              :key="line.key"
              class="diff-row"
              :class="'kind-' + line.kind"
            >
              <span class="gutter">{{ line.gutter1 ?? '' }}</span>
              <span class="gutter">{{ line.gutter2 ?? '' }}</span>
              <span class="sign">{{ line.sign }}</span>
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
        <div class="change-popup-actions">
          <el-button type="warning" title="用左侧此处内容覆盖右侧" @click="mergeBlock('toRight')">
            合并 →
          </el-button>
          <el-button text :icon="Close" title="关闭" @click="popupVisible = false" />
          <el-button type="success" title="用右侧此处内容覆盖左侧" @click="mergeBlock('toLeft')">
            ← 合并
          </el-button>
        </div>
      </div>

      <div v-if="store.viewMode === 'split'" class="split-container">
        <DiffPane
          ref="leftPane"
          :lines="leftLines"
          :tokens="tokens"
          @scroll="(top, left) => syncScroll('left', top, left)"
          @change-dblclick="onBlockDblClick"
        />
        <DiffPane
          ref="rightPane"
          :lines="rightLines"
          :tokens="tokens"
          @scroll="(top, left) => syncScroll('right', top, left)"
          @change-dblclick="onBlockDblClick"
        />
      </div>
      <div v-else class="unified-container">
        <DiffPane
          ref="unifiedPane"
          :lines="unifiedLines"
          :tokens="tokens"
          unified
          @scroll="(top, left) => ((scrollTop = top), (scrollLeft = left))"
          @change-dblclick="onBlockDblClick"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.result-toolbar {
  display: flex;
  align-items: center;
  padding: 8px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
  gap: 6px;

  z-index: 6;
}

@media (max-width: 1200px) {
  .prompt {
    display: none;
  }
}

@media (max-width: 900px) {
  .result-toolbar .el-button span:not(.el-icon) {
    display: none;
  }
  .result-toolbar .el-radio-button__inner {
    padding: 8px 10px;
  }
  .result-toolbar .m-l-12 {
    margin-left: 6px;
  }
  .lang-select {
    width: 100px !important;
  }
}

@media (max-width: 640px) {
  .result-toolbar {
    gap: 4px;
    padding: 6px;
  }
  .result-toolbar .el-tag {
    display: none;
  }
}

.lang-select {
  width: 160px;
}
.spacer {
  flex: 1;
}

/* 忽略规则面板（el-popover 内容） */
.ignore-panel-title,
.ignore-panel-subtitle {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.ignore-samples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  /* margin: 6px 0 4px 22px; */
}

.ignore-flags {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.sample-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* min-width: 24px; */
  width: min-content;
  height: 24px;
  padding: 0 2px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.rule-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.ignore-panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
}

.split-container {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--color-border);
}

.unified-container {
  flex: 1;
  min-height: 0;
  display: flex;
}

.result-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 双击变更块弹出的变更操作浮层：实体卡片，内含当前变更块的差异行 */
.change-popup {
  position: absolute;
  left: 8px;
  right: 8px;
  z-index: 5;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.22);
  overflow: hidden;
}

.change-popup-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  background: var(--color-bg);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.change-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.nav-btns {
  display: flex;
  gap: 6px;
}

.change-popup-body {
  max-height: 260px;
  overflow: auto;
  font-family: var(--font-mono);
  font-size: 13px;
}

.popup-diff.split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--color-border);
  overflow: hidden;
}

.popup-col {
  background: var(--color-surface);
}

.popup-col :deep(.el-scrollbar__bar.is-horizontal) {
  height: 0;
}

.change-popup-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: var(--color-bg);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.m-l-12 {
  margin-left: 12px;
}
.prompt {
  font-weight: 600;
  color: var(--color-text-secondary);
}
</style>
