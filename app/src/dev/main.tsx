// Browser dev harness entry (`pnpm dev`). Never part of the in-sim bundle.
import '@nobs/ui/base.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DevHarness } from './DevHarness'

const root = document.getElementById('dev-root')
if (!root) throw new Error('#dev-root not found')

createRoot(root).render(
  <StrictMode>
    <DevHarness />
  </StrictMode>,
)
