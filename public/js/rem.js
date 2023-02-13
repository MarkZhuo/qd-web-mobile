;(function (doc, win) {
  const docEl = doc.documentElement,
    resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
    recalc = function () {
      let clientWidth = win.innerWidth
      if (!clientWidth) return
      if (clientWidth > 3840) {
        clientWidth = 3840
      }
      if (clientWidth > 1920 && clientWidth <= 3840) {
        docEl.style.fontSize = '100' * (clientWidth / 1920) + 'px'
      } else if (clientWidth > 1120 && clientWidth <= 1920) {
        docEl.style.fontSize = '100px'
      } else if (clientWidth > 1024 && clientWidth <= 1120) {
        docEl.style.fontSize = 100 * (clientWidth / 1200) + 'px'
      } else if (clientWidth <= 1024 && clientWidth >= 768) {
        docEl.style.fontSize = 100 * (clientWidth / 1536) + 'px'
      } else if (clientWidth < 768) {
        docEl.style.fontSize = 100 * (clientWidth / 750) + 'px'
      } else if (clientWidth < 750 && clientWidth >= 350) {
        docEl.style.fontSize = 100 * (clientWidth / 350) + 'px'
      }
    }
  if (!doc.addEventListener) return
  recalc()
  win.addEventListener(resizeEvt, recalc, false)
  doc.addEventListener('DOMContentLoaded', recalc, false)
})(document, window)
