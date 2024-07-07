// To collect headings and then add to the page ToC
function pageToC () {
  var commentsIterator = document.createNodeIterator(
    document.querySelector('#main'),
    NodeFilter.SHOW_COMMENT,
  )
  while(commentsIterator.nextNode()) {
    var commentNode = commentsIterator.referenceNode
    if (commentNode.textContent.trim() === '{docsify-ignore-all}')
      return ''
  }

  let toc = ['<div class="page_toc">']
  const list = []
  const ignoreHeaders = window.$docsify.toc.ignoreHeaders || []
  const headings = document.querySelectorAll(`#main ${window.$docsify.toc.target}`)

  if (headings)
    headings.forEach(function (heading) {
      const innerText = heading.innerText
      const innerHtml = heading.innerHTML

      let needSkip = false
      if (ignoreHeaders.length > 0)
        needSkip = ignoreHeaders.some(str => innerText.match(str))

      const node = heading.nextSibling
      if (node.nodeType === node.COMMENT_NODE && node.textContent.trim() === '{docsify-ignore}')
        needSkip = true

      if (needSkip)
        return

      const item = generateToC(heading.tagName.replace(/h/gi, ''), innerHtml)
      if (item)
        list.push(item)
    })

  if (list.length > 0) {
    toc = toc.concat(list)
    toc.push('</div>')
    return toc.join('')
  }

  return ''
}

// To generate each ToC item
function generateToC (level, html) {
  if (level >= 1 && level <= window.$docsify.toc.tocMaxLevel) {
    const heading = ['<div class="lv' + level + '">', html, '</div>'].join('')
    return heading
  }
  return ''
}

// scroll listener
const scrollHandler = () => {
  const toc = {}
  const tocList = []
  document.querySelectorAll('.page_toc > div').forEach((el) => {
    const ref = el.firstElementChild.attributes['data-id'].value
    toc[ref] = el
    tocList.push(ref)
  })

  if (tocList.length === 0)
    return

  const clientHeight = window.innerHeight
  const visibleHeadings = []
  const headings = document.querySelectorAll(`#main ${window.$docsify.toc.target}`)

  headings.forEach((h) => {
    const ref = h.attributes['id'].value
    if (!toc[ref])
      return

    const rect = h.getBoundingClientRect()
    if (rect.top <= clientHeight && rect.top + rect.height > 0)
      visibleHeadings.push(ref)
  })

  let hightlighted = null
  const scrollingElement = document.scrollingElement || document.body
  const maxOffset = scrollingElement.scrollHeight - window.innerHeight

  // scrolled to top, choose the first one
  if (window.pageYOffset === 0)
    hightlighted = tocList[0]
  else if (Math.abs(window.pageYOffset - maxOffset) < 5) {
    // scrolled to bottom, choose the last one
    hightlighted = tocList.at(-1)
  }
  else if (visibleHeadings.length > 0)
    hightlighted = visibleHeadings[0]

  if (hightlighted)
    tocList.forEach((h) => {
      const el = toc[h]
      if (h === hightlighted)
        el.classList.add('active')
      else
        el.classList.remove('active')
    })
}

export function install (hook, vm) {
  hook.mounted(function () {
    const content = window.Docsify.dom.find('.content')
    if (content) {
      const nav = window.Docsify.dom.create('aside', '')
      window.Docsify.dom.toggleClass(nav, 'add', 'toc-nav')
      window.Docsify.dom.before(content, nav)
    }
  })
  hook.doneEach(function () {
    const nav = window.Docsify.dom.find('.toc-nav')
    if (nav) {
      nav.innerHTML = pageToC().trim()
      if (nav.innerHTML === '') {
        window.Docsify.dom.toggleClass(nav, 'add', 'nothing')
        window.document.removeEventListener('scroll', scrollHandler)
      } else {
        window.Docsify.dom.toggleClass(nav, 'remove', 'nothing')
        scrollHandler()
        window.document.addEventListener('scroll', scrollHandler)
      }
    }
  })
}
