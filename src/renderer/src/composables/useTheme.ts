import { ref, watch } from 'vue'
import { getElColorPrimary, handleThemeStyle } from '../utils/theme'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'hias-diff-theme'

function readStored(): ThemeMode {
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

/** 全局主题状态（模块级单例，供各组件共享与响应） */
export const theme = ref<ThemeMode>(readStored())

/** 应用到 <html>：dark 类同时驱动 Element Plus 暗色变量与本项目自有 --color-* 变量 */
function applyTheme(mode: ThemeMode): void {
  document.documentElement.classList.toggle('dark', mode === 'dark')
}

// 模块加载即应用已保存的主题，避免首屏闪烁
applyTheme(theme.value)

watch(theme, (mode) => {
  applyTheme(mode)
  localStorage.setItem(STORAGE_KEY, mode)
})

export function useTheme(): {
  theme: typeof theme
  isDark: () => boolean
  toggleTheme: () => void
} {
  const overloadThemeStyles = () => {
    const primaryColor = getElColorPrimary()
    handleThemeStyle(primaryColor)
  }
  overloadThemeStyles()
  return {
    theme,
    isDark: () => theme.value === 'dark',
    toggleTheme: () => {
      theme.value = theme.value === 'dark' ? 'light' : 'dark'
      overloadThemeStyles()
    }
  }
}
