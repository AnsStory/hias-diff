import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

/**
 * 纯渲染层（浏览器）开发/验证配置。
 *
 * 用途：在不启动 Electron 的前提下，用普通浏览器预览、调试与验证渲染层 UI。
 * 运行：npm run dev:web （默认 http://localhost:5199）
 *
 * 说明：正式的 Electron 三进程构建仍走 electron.vite.config.ts；此配置仅加载
 * src/renderer，不含 main/preload，window.api 等 Electron 注入能力在此环境下不可用，
 * 相关调用已用可选链（window.api?.…）做了空安全处理。
 */
export default defineConfig({
  root: 'src/renderer',
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src'),
      '@shared': resolve('src/shared')
    }
  },
  plugins: [
    vue(),
    // Vue DevTools 调试插件（仅 dev serve 生效）
    vueDevTools(),
    // Element Plus 按需（动态）导入：与 electron.vite.config.ts 保持一致
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts'
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts'
    })
  ],
  server: {
    port: 5199,
    strictPort: true
  },
  build: {
    outDir: resolve(__dirname, './docs')
  },
  base: './hias-diff'
})
