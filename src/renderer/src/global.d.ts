interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  prompt(): Promise<void>
}

interface Window {
  BeforeInstallPromptEvent?: BeforeInstallPromptEvent
}
