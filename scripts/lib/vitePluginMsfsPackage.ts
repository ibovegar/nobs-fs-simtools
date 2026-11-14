import type { Plugin } from 'vite'
import { assemblePackage, MISSING_SPB_HELP } from './assemble.ts'

/**
 * Re-assembles the Community-folder package (dist/nobs-fs-simtools) after every
 * production or watch build, so a Community-folder link always serves the latest code.
 */
export function msfsPackage(): Plugin {
  return {
    name: 'nobs:msfs-package',
    apply: 'build',
    closeBundle() {
      const { outDir, hasPanelDefinition } = assemblePackage({ clean: !this.meta.watchMode })
      this.info(`MSFS package assembled → ${outDir}`)
      if (!hasPanelDefinition) this.warn(MISSING_SPB_HELP)
    },
  }
}
