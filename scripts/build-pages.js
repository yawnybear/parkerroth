// Generates the static listing and detail pages from the CATEGORIES table below, so the
// shared side panel, header and footer stay identical everywhere. Run `npm run build` after
// editing this file and commit the output. (components.html is maintained by hand and
// lists the same stylesheets.)
const fs = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '..')

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
const LOREM_LONG = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'

// Intrinsic size of each media icon (see media-icon.css)
const ICONS = {
  story: ['story.svg', '28.0001', '29.1198'],
  design: ['design.svg', '33.0337', '26.4886'],
  video: ['video.svg', '38.8075', '25.9164'],
  photo: ['photo.svg', '39.9305', '26.3003'],
}

const NAV = [
  { key: 'design', label: 'Design', icon: 'design', href: 'index.html' },
  { key: 'video', label: 'Video', icon: 'video', href: 'video.html' },
  { key: 'photo', label: 'Photo', icon: 'photo', href: 'photo.html' },
  { key: 'about', label: 'About', icon: 'story', href: 'about.html' },
]

const indent = (str, n) => str.split('\n').map(l => (l ? ' '.repeat(n) + l : l)).join('\n')

const mediaIcon = type => {
  const [src, w, h] = ICONS[type]
  return `<span class="media-icon media-icon--${type}" aria-hidden="true"><img class="media-icon__image" src="assets/icons/${src}" width="${w}" height="${h}" alt=""></span>`
}

const sidePanel = active => `<aside class="side-panel">
  <div class="side-panel__body">
    <a class="brand" href="index.html">
      <span class="brand__line">Parker</span>
      <span class="brand__line">Douglas</span>
      <span class="brand__line">Roth</span>
    </a>
    <p class="side-panel__intro">Crafting thoughtful design, documenting authentic moments, and sharing stories in everything I do.</p>
  </div>
  <nav class="side-panel__footer" aria-label="Primary">
${NAV.map(item => {
  const isActive = item.key === active
  return `    <a class="nav-item nav-item--${item.icon}${isActive ? ' nav-item--active' : ''}" href="${item.href}"${isActive ? ' aria-current="page"' : ''}>
      <svg class="nav-item__outline" aria-hidden="true" focusable="false"><rect class="nav-item__outline-path"/></svg>
      ${mediaIcon(item.icon)}
      <span class="nav-item__label">${item.label}</span>
    </a>`
}).join('\n')}
  </nav>
</aside>`

const tags = () => `<ul class="card__tags">
  <li class="tag">Tag 1</li>
  <li class="tag">Tag 1</li>
  <li class="tag">Tag 1</li>
</ul>`

const projectCard = ({ name, href, withTags = false }) => `<a class="card card--project" href="${href}">
  <div class="card__media"></div>
  <div class="card__details">
    <div class="card__heading">
      <h3 class="card__title">${name}</h3>
      <p class="card__description">${LOREM}</p>
    </div>
${withTags ? indent(tags(), 4) + '\n' : ''}  </div>
</a>`

// Small cards show no visible title; the name is the link's accessible label instead.
const stackedCard = ({ name, href, withTags = false }) => `<a class="card card--project card--stacked" href="${href}" aria-label="${name}">
  <div class="card__media"></div>
${withTags ? `  <div class="card__details">
${indent(tags(), 4)}
  </div>
` : ''}</a>`

// A labelled row of cards; its header floats once it scrolls out of view
const carousel = ({ label, cards }) => `<section class="carousel carousel--full-bleed" data-carousel aria-label="${label}">
  <header class="content-header content-header--sticky" data-floating-header>
    <nav class="breadcrumbs" aria-label="Section">
      <span class="breadcrumbs__label">${label}</span>
    </nav>
    <div class="content-header__aside carousel__controls">
      <button class="btn" type="button" data-carousel-prev aria-label="Previous ${label}">&lt;</button>
      <button class="btn" type="button" data-carousel-next aria-label="Next ${label}">&gt;</button>
    </div>
  </header>
  <ul class="carousel__track" data-carousel-track>
${cards.map(c => `    <li class="carousel__item">\n${indent(c, 6)}\n    </li>`).join('\n')}
  </ul>
</section>`

const siteFooter = `<footer class="site-footer page-content__footer">
  <a class="brand brand--initials" href="index.html" aria-label="Parker Douglas Roth">PdR</a>
  <div class="site-footer__credits">
    <p class="site-footer__credit">Designed by a human</p>
    <p class="site-footer__credit">In Greenville, South Carolina</p>
    <p class="site-footer__credit site-footer__credit--muted">Copyright, 2026</p>
  </div>
</footer>`

// Speculation rules (Chrome/Edge; ignored elsewhere): prerender the pages you're likely
// to open next, so navigating doesn't wait on the network and the view transition can
// start immediately. A detail page eagerly prerenders the listing its X returns to;
// cards, photo tiles and nav items prerender on hover.
const speculationRules = main => {
  const closeHref = main.match(/<a class="btn" href="([^"]+)" aria-label="Close">/)?.[1]
  const rules = { prerender: [] }
  if (closeHref) rules.prerender.push({ urls: [closeHref], eagerness: 'eager' })
  rules.prerender.push({
    where: { selector_matches: 'a.card, a.media-grid__link[href$=".html"], a.nav-item' },
    eagerness: 'moderate',
  })
  return `  <script type="speculationrules">${JSON.stringify(rules)}</script>\n`
}

// Stylesheets in cascade order. Each is its own <link>, so the browser fetches them in
// parallel (CSS @import would chain the requests and delay every page change).
const STYLESHEETS = [
  // Optics core (no icon font: this project uses its own SVG media icons)
  'node_modules/@rolemodel/optics/dist/css/optics+no_icons.css',
  // Project tokens + Optics token overrides, base element styles
  'src/stylesheets/tokens.css',
  'src/stylesheets/base.css',
  // Optics components, customized through their public API
  ...['card', 'tag', 'button', 'breadcrumbs', 'content-header', 'side-panel'].map(f => `src/stylesheets/optics-overrides/${f}.css`),
  // Project blocks with no Optics equivalent
  ...['media-icon', 'nav-item', 'brand', 'site-footer', 'page-content', 'carousel', 'media-grid', 'project-detail'].map(f => `src/stylesheets/components/${f}.css`),
  // Card ⇄ detail page transitions
  'src/stylesheets/page-transitions.css',
]

// Each behaviour script is loaded only on pages that use it
const page = ({ title, active, main }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap">
${STYLESHEETS.map(href => `  <link rel="stylesheet" href="${href}">`).join('\n')}
  <link rel="expect" href="#page-end" blocking="render">
  <script src="src/javascript/page-transitions.js"></script>
  <script src="src/javascript/nav-select.js" defer></script>
${main.includes('data-carousel') ? '  <script src="src/javascript/carousel.js" defer></script>\n' : ''}${main.includes('data-floating-header') ? '  <script src="src/javascript/floating-header.js" defer></script>\n' : ''}${main.includes('data-image-index') ? '  <script src="src/javascript/image-viewer.js" defer></script>\n' : ''}${speculationRules(main)}</head>
<body>
  <div class="app-with-sidebar">
${indent(sidePanel(active), 4)}
    <div class="app-body">
      <div class="page-content">
        <main class="page-content__main">
${indent(main, 10)}
        </main>
${indent(siteFooter, 8)}
      </div>
    </div>
  </div>
  <span id="page-end" hidden></span>
</body>
</html>
`


// Breadcrumb trail for a detail view: category, then the project
// ("Product / Project"); deeper views add levels ("… / Image 2"). Each earlier
// crumb links one step back; the last crumb is the current page.
const breadcrumbTrail = trail => trail.map((crumb, i) => i === trail.length - 1
  ? `      <span class="breadcrumbs__text" aria-current="page">${crumb.label}</span>`
  : `      <a class="breadcrumbs__link" href="${crumb.href}">${crumb.label}</a>
      <span class="breadcrumbs__separator" aria-hidden="true">/</span>`).join('\n')

const detail = ({ trail, closeHref, body }) => `<article class="project-detail">
  <header class="content-header content-header--sticky" data-floating-header>
    <nav class="breadcrumbs" aria-label="Breadcrumb">
${breadcrumbTrail(trail)}
    </nav>
    <div class="content-header__aside">
      <a class="btn" href="${closeHref}" aria-label="Close">X</a>
    </div>
  </header>
  <div class="project-detail__body">
    <div class="project-detail__content">
${indent(numberImages(body), 6)}
    </div>
  </div>
</article>`

const copy = (title, text = LOREM_LONG) => `<div class="project-detail__copy">
${title ? `  <h1 class="project-detail__title">${title}</h1>\n` : ''}  <p class="project-detail__text">${text}</p>
</div>`

// Image links carry a __IMG__ placeholder; detail() numbers them in page order
// ("Image 1", "Image 2", …). Opening one shows it in place (image-viewer.js).
const IMG = '__IMG__'
const imageLinkAttrs = `href="?image=${IMG}" data-image-index="${IMG}" aria-label="Image ${IMG}"`

// The banner image is static (not openable)
const hero = () => '<div class="project-detail__hero"></div>'

const grid = (count, modifiers = []) => `<ul class="media-grid media-grid--inset${modifiers.map(m => ' media-grid--' + m).join('')} project-detail__gallery">
${Array.from({ length: count }, () => `  <li><a class="media-grid__link" ${imageLinkAttrs}><span class="media-grid__item"></span></a></li>`).join('\n')}
</ul>`

const numberImages = html => {
  let n = 0
  // each link has exactly three placeholders (href, data attribute, label)
  return html.replace(new RegExp(`href="\\?image=${IMG}" data-image-index="${IMG}" aria-label="Image ${IMG}"`, 'g'),
    () => { n += 1; return `href="?image=${n}" data-image-index="${n}" aria-label="Image ${n}"` })
}

// ---- Pages ----------------------------------------------------------------
// Placeholder content: every project is titled "Project". Each card opens its own
// detail page, named by category and position (e.g. product-01.html).

const TITLE = 'Project'
const pad = n => String(n).padStart(2, '0')

// label: section label + breadcrumb category; page: the listing it lives on.
// card: 'inline' (large) or 'stacked' (small); tags: which cards show tags.
// body: the detail page's layout.
const CATEGORIES = [
  { key: 'product', label: 'Product', page: 'index.html', nav: 'design', count: 3, card: 'inline', tags: [3],
    body: () => [hero(), copy(TITLE), grid(3), copy(null), grid(3)] },
  { key: 'brand', label: 'Brand', page: 'index.html', nav: 'design', count: 5, card: 'stacked',
    body: () => [hero(), copy(TITLE), grid(3)] },
  { key: 'documentary', label: 'Documentary', page: 'video.html', nav: 'video', count: 3, card: 'inline', tags: [3],
    body: () => [hero(), copy(TITLE), grid(9, ['widescreen'])] },
  { key: 'narrative', label: 'Narrative', page: 'video.html', nav: 'video', count: 1, card: 'inline',
    body: () => [hero(), copy(TITLE), grid(3, ['widescreen'])] },
  { key: 'experimental', label: 'Experimental', page: 'video.html', nav: 'video', count: 5, card: 'stacked', tags: 'all',
    body: () => [hero(), copy(TITLE), grid(3, ['widescreen'])] },
  { key: 'photo', label: 'Gallery', page: 'photo.html', nav: 'photo', count: 14, card: 'tile',
    body: () => [hero(), copy(TITLE)] },
]

const detailHref = (category, i) => `${category.key}-${pad(i)}.html`
const items = category => Array.from({ length: category.count }, (_, idx) => idx + 1)
const hasTags = (category, i) => category.tags === 'all' || (category.tags || []).includes(i)

const cardsFor = category => items(category).map(i => {
  const href = detailHref(category, i)
  const withTags = hasTags(category, i)
  return category.card === 'stacked'
    ? stackedCard({ name: TITLE, href, withTags })
    : projectCard({ name: TITLE, href, withTags })
})
const rowsFor = page => CATEGORIES.filter(c => c.page === page && c.card !== 'tile').map(c => ({ label: c.label, cards: cardsFor(c) }))

const photo = CATEGORIES.find(c => c.key === 'photo')

const pages = {
  'index.html': page({
    title: 'Design — Parker Douglas Roth',
    active: 'design',
    main: rowsFor('index.html').map(carousel).join('\n'),
  }),

  'video.html': page({
    title: 'Video — Parker Douglas Roth',
    active: 'video',
    main: rowsFor('video.html').map(carousel).join('\n'),
  }),

  'photo.html': page({
    title: 'Photo — Parker Douglas Roth',
    active: 'photo',
    main: `<header class="content-header content-header--sticky" data-floating-header>
  <nav class="breadcrumbs" aria-label="Section">
    <span class="breadcrumbs__label">${photo.label}</span>
  </nav>
</header>
<ul class="media-grid media-grid--gallery">
${items(photo).map(i => `  <li><a class="media-grid__link" href="${detailHref(photo, i)}" aria-label="${TITLE}"><span class="media-grid__item"></span></a></li>`).join('\n')}
</ul>`,
  }),
}

// About: a single panel (banner + copy) under a lone section label, laid out like a
// project page but without the close button
pages['about.html'] = page({
  title: 'About — Parker Douglas Roth',
  active: 'about',
  main: `<article class="project-detail">
  <header class="content-header content-header--sticky" data-floating-header>
    <nav class="breadcrumbs" aria-label="Section">
      <span class="breadcrumbs__label">About</span>
    </nav>
  </header>
  <div class="project-detail__body">
    <div class="project-detail__content">
${indent([hero(), copy('About')].join('\n'), 6)}
    </div>
  </div>
</article>`,
})

for (const category of CATEGORIES) {
  for (const i of items(category)) {
    pages[detailHref(category, i)] = page({
      title: `${TITLE} — Parker Douglas Roth`,
      active: category.nav,
      main: detail({
        trail: [{ label: category.label, href: category.page }, { label: TITLE }],
        closeHref: category.page,
        body: category.body().join('\n'),
      }),
    })
  }
}

for (const [file, html] of Object.entries(pages)) {
  fs.writeFileSync(path.join(ROOT, file), html)
  console.log('wrote', file)
}
