import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
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
      // Element Plus 按需（动态）导入：仅打包用到的组件及其样式，减小体积
      AutoImport({
        resolvers: [ElementPlusResolver()],
        // dts 路径相对于 renderer 的 vite root（src/renderer）
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
        manifest: {
          name: 'hias-diff',
          short_name: 'hias-diff',
          description: 'hias-diff 对比工具',
          display: 'standalone',
          background_color: '#23272e',
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
          globPatterns: ['**/*.{html,js,css,png,svg,ico,woff2}']
        }
      })
    ]
  }
})
