// Pages: the app's screens, one per tab, listed in pageRegistry.ts. Each page is a
// self-contained module that owns everything only it uses:
//
//   pages/<Page>/
//     <Page>.tsx     the screen: the page's top-level container (state via a hook from
//                    ./hooks), laid out in a @nobs/ui <Container>
//     hooks/         the page's stateful hooks: persistence, sim data (useTopOfDescent,
//                    useInkPages)
//     containers/    sub-containers with their own state, when the page has several
//                    (e.g. Notes' InkPad / AtcPad / TextPad)
//     components/    views: props in, callbacks out
//     domain/        pure rules and calculations, unit-tested
//
// Pages never import another page's internals. Code needed by two or more pages is
// either generic (move it to @nobs/ui) or app-specific (src/components/, e.g. SimValueField).

export { InFlight } from './InFlight'
export { Info } from './Info'
export { Notes } from './Notes'
export { Planning } from './Planning'
export { PAGES, type PageDefinition } from './pageRegistry'
export { Settings } from './Settings'
