declare module 'pannellum' {
  interface PannellumConfig {
    type?: string
    panorama?: string
    autoLoad?: boolean
    showControls?: boolean
    compass?: boolean
    showZoomCtrl?: boolean
    showFullscreenCtrl?: boolean
    hotSpots?: Array<{
      id?: string
      type: string
      pitch: number
      yaw: number
      text?: string
      clickHandlerFunc?: () => void
      sceneId?: string
      targetPitch?: number
      targetYaw?: number
    }>
    scenes?: Record<string, any>
    sceneFadeDuration?: number
  }

  function viewer(container: string | HTMLElement, config: PannellumConfig): any
}
