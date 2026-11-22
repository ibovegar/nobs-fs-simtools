import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface ErrorBoundaryFallbackProps {
  error: unknown
  /** React's component stack at the crash ('' until it is known). */
  componentStack: string
  /** Renders the children again. */
  reset: () => void
}

interface ErrorBoundaryProps {
  /** What to show instead of the children once they throw while rendering. */
  fallback: (props: ErrorBoundaryFallbackProps) => ReactNode
  /** Called once per crash, e.g. to log it. */
  onError?: (error: unknown, componentStack: string) => void
  children?: ReactNode
}

interface ErrorBoundaryState {
  error: unknown
  failed: boolean
  componentStack: string
}

/**
 * Catches an error thrown while rendering its children and shows `fallback` instead, so one
 * broken view doesn't blank the whole app. Errors in event handlers and promises aren't
 * caught (React doesn't route them here).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: undefined, failed: false, componentStack: '' }

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return { error, failed: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    const componentStack = info.componentStack ?? ''
    this.setState({ componentStack })
    this.props.onError?.(error, componentStack)
  }

  reset = () => {
    this.setState({ error: undefined, failed: false, componentStack: '' })
  }

  render() {
    const { fallback, children } = this.props
    const { error, failed, componentStack } = this.state
    if (!failed) return children
    return fallback({ error, componentStack, reset: this.reset })
  }
}
