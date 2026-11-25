// Opens a project's images in place (see .project-detail__viewer in project-detail.css).
//
// Every image container in a detail page is a link to "?image=N". Opening one replaces
// the body's content with that image and adds a breadcrumb level ("Propertyintel /
// Image 2"); the project crumb and the X step back out. The URL is kept in sync, so the
// back/forward buttons and shared links work (and without JS the link still reloads to
// the same state). Changes morph the image between its container and the viewer with a
// same-document view transition where supported.
;(() => {
  const VT_NAME = 'project-image'
  const body = document.querySelector('.project-detail__body')
  const crumbs = document.querySelector('.project-detail .breadcrumbs')
  const close = document.querySelector('.project-detail .content-header__aside .btn')
  if (!body || !crumbs || !close) return

  const sources = [...body.querySelectorAll('[data-image-index]')]
  if (!sources.length) return

  const projectCrumbs = crumbs.innerHTML
  const projectTitle = crumbs.querySelector('[aria-current]')?.textContent.trim() ?? document.title
  const sectionHref = close.getAttribute('href')
  const projectHref = location.pathname.split('/').pop() || 'index.html'

  let viewer = null
  let current = null
  // Scroll position of the project content, restored when stepping back out
  const scroller = body.closest('.app-body') ?? document.scrollingElement
  let projectScroll = 0

  const imageFromUrl = () => {
    const n = parseInt(new URLSearchParams(location.search).get('image'), 10)
    return sources.some(s => Number(s.dataset.imageIndex) === n) ? n : null
  }
  const sourceFor = n => sources.find(s => Number(s.dataset.imageIndex) === n)
  const containerOf = link => link.firstElementChild ?? link

  function render(n) {
    const wasOpen = current !== null
    viewer?.remove()
    viewer = null
    current = n

    if (n === null) {
      body.classList.remove('project-detail__body--viewing')
      crumbs.innerHTML = projectCrumbs
      close.setAttribute('href', sectionHref)
      close.setAttribute('aria-label', 'Close')
      if (wasOpen) scroller.scrollTop = projectScroll
      return
    }

    if (!wasOpen) projectScroll = scroller.scrollTop

    const source = containerOf(sourceFor(n))
    const box = source.getBoundingClientRect()
    const ratio = box.width && box.height ? box.width / box.height : 1

    viewer = document.createElement('div')
    viewer.className = 'project-detail__viewer'
    const image = document.createElement('div')
    image.className = 'project-detail__viewer-image'
    image.style.setProperty('--_project-detail-viewer-ratio', ratio.toFixed(4))
    image.setAttribute('role', 'img')
    image.setAttribute('aria-label', `${projectTitle}, image ${n}`)
    // Keep any real content (e.g. a brand logo) from the source container
    image.append(...[...source.children].map(child => child.cloneNode(true)))
    viewer.append(image)
    body.append(viewer)
    body.classList.add('project-detail__body--viewing')

    crumbs.innerHTML = `
      <a class="breadcrumbs__link" href="${projectHref}">${projectTitle}</a>
      <span class="breadcrumbs__separator" aria-hidden="true">/</span>
      <span class="breadcrumbs__text" aria-current="page">Image ${n}</span>`
    close.setAttribute('href', projectHref)
    close.setAttribute('aria-label', `Close image ${n}`)
    // Bring the opened image into view (below the floating breadcrumb bar). This runs
    // inside the view transition, so the thumbnail morphs straight into place.
    viewer.scrollIntoView({ block: 'start', behavior: 'instant' })
  }

  // Morph between the image's container and the viewer
  function transitionTo(n) {
    if (n === current) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduced) return render(n)

    const previous = current
    // Opening: thumbnail -> viewer. Closing: viewer -> the thumbnail it came from.
    const from = previous === null ? containerOf(sourceFor(n)) : viewer.firstElementChild
    from.style.viewTransitionName = VT_NAME
    // Lets page-transitions.css keep the body as one container that only swaps content
    document.documentElement.dataset.imageTransition = ''
    const transition = document.startViewTransition(() => {
      from.style.viewTransitionName = ''
      render(n)
      const to = n === null ? containerOf(sourceFor(previous)) : viewer.firstElementChild
      to.style.viewTransitionName = VT_NAME
    })
    transition.finished.finally(() => {
      body.querySelectorAll('[style*="view-transition-name"]').forEach(el => { el.style.viewTransitionName = '' })
      delete document.documentElement.dataset.imageTransition
    })
  }

  function go(n) {
    if (n === current) return
    history.pushState({ image: n }, '', n === null ? projectHref : `?image=${n}`)
    transitionTo(n)
  }

  // Open an image
  body.addEventListener('click', event => {
    const link = event.target.closest('[data-image-index]')
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    go(Number(link.dataset.imageIndex))
  })

  // Step back out via the project crumb or the X (only while an image is open)
  document.querySelector('.project-detail .content-header').addEventListener('click', event => {
    if (current === null) return
    const link = event.target.closest('a')
    if (!link || (link !== close && !link.classList.contains('breadcrumbs__link'))) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    go(null)
  })

  // Back / forward
  window.addEventListener('popstate', () => transitionTo(imageFromUrl()))

  // Deep link (?image=N) on load: show it straight away, no transition
  const initial = imageFromUrl()
  if (initial !== null) render(initial)
})()
