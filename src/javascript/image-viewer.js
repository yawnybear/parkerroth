// Opens a project's images in place (see .project-detail__viewer in project-detail.css).
//
// Every grid image in a detail page is a link to "?image=N". Opening one replaces the
// body's content with that image and adds a breadcrumb level ("Product / Project /
// Image 2"); the project crumb steps back out, while the X always closes the whole page.
// The URL is kept in sync, so back/forward and shared links work (without JS the link
// reloads to the same page). Changes morph the image between its container and the
// viewer with a same-document view transition where supported.
;(() => {
  const VT_NAME = 'project-image'
  const body = document.querySelector('.project-detail__body')
  const crumbs = document.querySelector('.project-detail .breadcrumbs')
  if (!body || !crumbs) return

  const sources = [...body.querySelectorAll('[data-image-index]')]
  if (!sources.length) return

  const projectCrumbs = crumbs.innerHTML
  const projectTitle = crumbs.querySelector('[aria-current]')?.textContent.trim() ?? document.title
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
    // Keep any real content (e.g. an image) from the source container
    image.append(...[...source.children].map(child => child.cloneNode(true)))
    viewer.append(image)
    body.append(viewer)
    body.classList.add('project-detail__body--viewing')

    // Keep the page's trail (e.g. "Product / Project"), turn the current crumb
    // into a link back to the project, and add the image as the new current level
    crumbs.innerHTML = projectCrumbs
    const projectCrumb = crumbs.querySelector('[aria-current]')
    const projectLink = document.createElement('a')
    projectLink.className = 'breadcrumbs__link'
    projectLink.href = projectHref
    projectLink.textContent = projectTitle
    projectCrumb.replaceWith(projectLink)
    crumbs.insertAdjacentHTML('beforeend', `
      <span class="breadcrumbs__separator" aria-hidden="true">/</span>
      <span class="breadcrumbs__text" aria-current="page">Image ${n}</span>`)
    // Start the opened image at the top of the page so the header stays attached
    // (not floating) and the image begins right under it. This runs inside the view
    // transition, so the thumbnail morphs straight into place.
    scroller.scrollTop = 0
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
    document.documentElement.dataset.imageTransition = n === null ? 'close' : 'open'
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

  // Step back out to the project via its crumb (only while an image is open).
  // The category crumb and the X are normal links: the X always closes the whole page.
  crumbs.addEventListener('click', event => {
    if (current === null) return
    const link = event.target.closest('a')
    if (!link || link.getAttribute('href') !== projectHref) return
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
