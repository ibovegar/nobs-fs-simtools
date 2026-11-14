import { ERASER_RADIUS, type Stroke, strokeHit } from '~/pages/Notes/domain'
import { usePersistentState } from '~/storage'

interface InkState {
  pages: Stroke[][]
  page: number
}

const MAX_PAGES = 20
const EMPTY: InkState = { pages: [[]], page: 0 }

/** Multi-page ink notebook, persisted. */
export function useInkPages() {
  const [state, setState] = usePersistentState<InkState>('scratchpad.ink.v1', EMPTY)
  const page = Math.min(state.page, state.pages.length - 1)
  const strokes = state.pages[page] ?? []

  const updatePage = (fn: (strokes: Stroke[]) => Stroke[]) =>
    setState((prev) => ({
      ...prev,
      pages: prev.pages.map((s, i) => (i === page ? fn(s) : s)),
    }))

  return {
    strokes,
    page,
    pageCount: state.pages.length,
    canAddPage: state.pages.length < MAX_PAGES,

    addStroke: (stroke: Stroke) => updatePage((s) => [...s, stroke]),
    /** Erase every stroke under the point, judged against the latest strokes. */
    eraseAt: (x: number, y: number) =>
      updatePage((s) => {
        const kept = s.filter((stroke) => !strokeHit(stroke, x, y, ERASER_RADIUS))
        return kept.length === s.length ? s : kept
      }),
    /** Removes the most recent stroke on this page. */
    undo: () => updatePage((s) => s.slice(0, -1)),
    clearPage: () => updatePage(() => []),

    goToPage: (index: number) =>
      setState((prev) => ({ ...prev, page: Math.max(0, Math.min(prev.pages.length - 1, index)) })),
    addPage: () =>
      setState((prev) =>
        prev.pages.length >= MAX_PAGES
          ? prev
          : { pages: [...prev.pages, []], page: prev.pages.length },
      ),
  }
}
