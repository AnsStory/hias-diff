import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { VitePWA } from 'vite-plugin-pwa'

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
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      devOptions: {
        enabled: true
      },
      // 开启生成manifest清单（Edge识别安装必备）
      manifest: {
        name: 'hias-diff 对比工具', // edge应用显示全称
        short_name: 'hias-diff',
        start_url: '/',
        display: 'standalone', // 独立窗口，不带浏览器地址栏，和GitHub效果完全一致
        background_color: '#23272e', // 启动背景色，适配深色
        theme_color: '#7e57c2',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // 开启静态资源离线缓存（可选，断网依然能打开页面）
        globPatterns: ['**/*.{html,js,css,png,svg,ico,woff2}']
      }
    })
  ],
  server: {
    port: 5199,
    strictPort: true
  },
  build: {
    outDir: resolve(__dirname, './docs')
  },
  base: '/hias-diff/'
})
