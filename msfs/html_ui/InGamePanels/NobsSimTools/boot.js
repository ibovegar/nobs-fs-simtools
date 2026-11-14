// Startup diagnostics for the Nobs SimTools panel. Loaded BEFORE simtools.js, in plain ES5
// so it runs even where the app bundle can't.
//
// The sim's panel browser has no visible console, so a startup failure would just leave an
// empty window. This records the boot steps the app reports (window.__nobsBoot), catches
// uncaught errors, and if the app hasn't rendered within a few seconds — or an error
// happens before it has — writes what it knows into the panel itself.
;(function () {
  var steps = ['boot.js loaded']
  var errors = []
  var mounted = false
  var WATCHDOG_MS = 6000

  function describe(value) {
    if (!value) return String(value)
    if (value.stack) return String(value.stack).split('\n').slice(0, 4).join('\n')
    if (value.message) return String(value.message)
    return String(value)
  }

  function show() {
    if (mounted) return
    var root = document.getElementById('nobs-simtools-root')
    if (!root) return
    var text =
      'Nobs SimTools could not start.\n\n' +
      (errors.length ? 'Errors:\n' + errors.join('\n\n') + '\n\n' : 'No error was reported.\n\n') +
      'Startup steps reached:\n  - ' +
      steps.join('\n  - ')
    var box = document.getElementById('nobs-boot-report')
    if (!box) {
      box = document.createElement('pre')
      box.id = 'nobs-boot-report'
      box.style.cssText =
        'margin:0;padding:16px;white-space:pre-wrap;font:14px/1.4 Consolas,monospace;' +
        'color:#f4c5c2;background:#171f24;width:100%;height:100%;overflow:auto;'
      root.appendChild(box)
    }
    box.textContent = text
  }

  // The app calls this at each startup step; 'mounted' means React has rendered.
  window.__nobsBoot = function (step) {
    if (step === 'mounted') {
      mounted = true
      return
    }
    steps.push(step)
  }

  window.__nobsBootError = function (error) {
    errors.push(describe(error))
    show()
  }

  window.addEventListener('error', function (event) {
    var where = event.filename ? ' (' + event.filename.split('/').pop() + ':' + event.lineno + ')' : ''
    errors.push(describe(event.error || event.message) + where)
    show()
  })

  window.addEventListener('unhandledrejection', function (event) {
    errors.push('Unhandled promise rejection: ' + describe(event.reason))
    show()
  })

  setTimeout(function () {
    if (!mounted) {
      steps.push('... not rendered after ' + WATCHDOG_MS / 1000 + ' s')
      show()
    }
  }, WATCHDOG_MS)

  // The panel element is in the body, which isn't parsed yet when this runs.
  document.addEventListener('DOMContentLoaded', function () {
    if (errors.length) show()
  })
})()
