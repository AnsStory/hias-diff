import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { VitePWA } from 'vite-plugin-pwa'

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
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts'
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts'
    }),
    VitePWA({
      injectRegister: 'script',
      devOptions: {
        enabled: true
      },
      // 开启生成manifest清单（Edge识别安装必备）
      manifest: {
        name: 'hias-diff', // edge应用显示全称
        short_name: 'hias-diff',
        description: 'hias-diff 对比工具',
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
