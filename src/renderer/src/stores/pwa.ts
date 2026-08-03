import { ref, onMounted, onUnmounted } from 'vue'
import { defineStore } from 'pinia'

export const usePwaStore = defineStore('pwa', () => {
  const deferredPrompt = ref<any>(null)
  const canInstall = ref(false)

  async function install() {
    if (!deferredPrompt.value) return false
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    if (outcome === 'accepted') {
      canInstall.value = false
    }
    deferredPrompt.value = null
    return outcome === 'accepted'
  }

  function onBeforeInstallPrompt(e: Event) {
    e.preventDefault()
    deferredPrompt.value = e
    canInstall.value = true
  }

  function onAppInstalled() {
    canInstall.value = false
    deferredPrompt.value = null
  }

  function init() {
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
  }

  function destroy() {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', onAppInstalled)
  }

  return { canInstall, install, init, destroy }
})
