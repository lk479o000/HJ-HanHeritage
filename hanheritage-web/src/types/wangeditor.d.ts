declare module '@wangeditor/editor-for-vue' {
  import { DefineComponent } from 'vue'
  import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

  export const Editor: DefineComponent<{
    defaultConfig?: Partial<IEditorConfig>
    mode?: string
    modelValue?: string
    [key: string]: unknown
  }>
  
  export const Toolbar: DefineComponent<{
    editor?: IDomEditor | null
    defaultConfig?: Partial<IToolbarConfig>
    mode?: string
    [key: string]: unknown
  }>
}
