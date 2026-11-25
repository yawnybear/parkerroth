// Pairs the clicked card with the detail page's body for the cross-document view
// transition (see page-transitions.css). The detail body is always named
// "project-detail"; on a listing page the matching card is given that name just for
// the transition. Naming on demand avoids duplicate names on pages where many links
// share a destination (e.g. the photo grid), which would cancel the transition.
//
// Loaded in <head> without defer so the listeners exist before the first render;
// <link rel="expect" ... blocking="render"> keeps that render waiting for the DOM.
;(() => {
  const NAME = 'project-detail'
  const CARD_SELECTOR = 'a.card, a.media-grid__link'

  const samePage = (a, b) => {
    try { return new URL(a, location.href).pathname === new URL(b, location.href).pathname } catch { return false }
  }

  const clearNames = () => {
    document.querySelectorAll('[data-vt-named]').forEach(el => {
      el.style.viewTransitionName = ''
      delete el.dataset.vtNamed
    })
  }

  const name = el => {
    el.style.viewTransitionName = NAME
    el.dataset.vtNamed = ''
  }

  const cardFor = url => [...document.querySelectorAll(CARD_SELECTOR)].find(a => samePage(a.href, url))

  // Leaving this page: name the card being opened
  window.addEventListener('pageswap', event => {
    clearNames()
    const to = event.activation?.entry?.url
    if (!event.viewTransition || !to) return
    const card = cardFor(to)
    if (card) name(card)
  })

  // Arriving on this page: name the card we came back from
  window.addEventListener('pagereveal', event => {
    clearNames()
    const from = navigation?.activation?.from?.url
    if (!event.viewTransition || !from) return
    const card = cardFor(from)
    if (!card) return
    name(card)
    event.viewTransition.finished.finally(clearNames)
  })
})()
