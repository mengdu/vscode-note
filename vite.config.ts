import { defineConfig, build, type Plugin } from 'vite'
import { builtinModules } from 'node:module'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url))

function backend(): Plugin {
  let watcher: Awaited<ReturnType<typeof build>> | undefined

  let mode = 'production'

  function compile(watch: boolean) {
    return build({
      configFile: false,
      root: resolve('./'),
      publicDir: false,
      mode,
      build: {
        ssr: resolve('./src/extension/main.ts'),
        target: 'node20',
        outDir: resolve('./dist/extension'),
        emptyOutDir: true,
        minify: false,
        sourcemap: true,
        rolldownOptions: {
          external: [/^node:/, 'vscode', ...builtinModules],
          output: {
            format: 'module',
            entryFileNames: 'main.js',
          },
        },
        watch: watch ? {} : null,
      },
    })
  }

  return {
    name: 'vscode-extension',
    configResolved(config) {
      mode = config.mode
    },
    async configureServer(server) {
      watcher = await compile(true)

      if ('on' in watcher) {
        watcher.on('event', (event) => {
          if (event.code === 'ERROR') {
            server.config.logger.error(`[extension] ${event.error.message}`)
          }
        })
      }
    },
    async writeBundle() {
      await compile(false)
    },
    async closeBundle() {
      if (watcher && 'close' in watcher) {
        await watcher.close()
        watcher = undefined
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    backend(),
    tailwindcss(),
  ],
  base: process.env.NODE_ENV === 'production' ? './' : undefined,
  server: {
    port: 4321,
    strictPort: true,
    cors: true
  },
  build: {
    outDir: 'dist/webview',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src/webview'),
    },
  },
})
