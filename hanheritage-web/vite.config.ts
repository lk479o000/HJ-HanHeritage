import { defineConfig, type UserConfigExport } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { loadEnv } from 'vite'

export default ({ mode }: { mode: string }): UserConfigExport => {
  const env = loadEnv(mode, process.cwd())
  
  return defineConfig({
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag === 'model-viewer',
          },
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/styles/variables" as *;\n`,
        },
      },
    },
    server: {
      port: 5183,
      proxy: env.VITE_LOCAL_MODE === 'true' ? {} : {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:3083',
          changeOrigin: true,
        },
      },
    },
    define: {
      'import.meta.env.VITE_LOCAL_MODE': JSON.stringify(env.VITE_LOCAL_MODE),
    },
  })
}
