import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { msfsPackage } from '../scripts/lib/vitePluginMsfsPackage.ts'

// The root package.json is the single source of truth for the version: it is shown in
// the UI, written to the MSFS manifest and stamped on the installer.
const { version } = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf8'),
)

export default defineConfig(({ mode }) => ({
  // msfsPackage() assembles dist/nobs-fs-simtools (the Community-folder package) after
  // every build, including each rebuild in watch mode.
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), msfsPackage()],
  resolve: {
    alias: {
      '~': resolve(import.meta.dirname, 'src'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
    // Library mode doesn't replace process.env.NODE_ENV, which React reads.
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
  },
  // `pnpm dev` serves index.html (the browser dev harness, src/dev/main.tsx).
  // `pnpm build` produces the in-sim bundle: one classic IIFE script + one stylesheet
  // with fixed names, loaded by the panel's HTML shell (msfs/html_ui/InGamePanels/NobsSimTools/).
  build: {
    // The sim's embedded Coherent browser is not evergreen: keep syntax and CSS
    // conservative. See docs/coherent-compat.md.
    target: 'es2017',
    cssTarget: 'chrome61',
    outDir: 'dist',
    emptyOutDir: true,
    // public/ holds dev-harness assets only (favicon); keep them out of the package.
    copyPublicDir: false,
    // `pnpm build:watch` builds in development mode: unminified, with source maps and
    // React's dev warnings — readable in the sim's Coherent debugger.
    minify: mode === 'production',
    sourcemap: mode !== 'production',
    lib: {
      entry: resolve(import.meta.dirname, 'src/main.tsx'),
      formats: ['iife'],
      name: 'NobsSimTools',
      fileName: () => 'simtools.js',
      cssFileName: 'simtools',
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
