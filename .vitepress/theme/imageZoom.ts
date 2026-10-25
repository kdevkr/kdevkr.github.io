import 'photoswipe/style.css'

let isInitialized = false

/**
 * 마크다운 본문 이미지 클릭 시 라이트박스 팝업 및 확대(Zoom/Pan/Pinch) 기능 초기화
 */
export function initImageZoom() {
  if (typeof window === 'undefined' || isInitialized) return
  isInitialized = true

  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement | null
    if (!target || target.tagName !== 'IMG') return

    // 본문 컨테이너 (.vp-doc, .main) 내부의 이미지인지 확인
    const docContainer = target.closest('.vp-doc, .main')
    if (!docContainer) return

    // 링크(<a>) 내부 이미지는 링크 동작 우선
    if (target.closest('a')) return

    // 제외 클래스 (.no-zoom)
    if (target.classList.contains('no-zoom')) return

    e.preventDefault()

    const clickedImg = target as HTMLImageElement

    // 문서 내 클릭 가능한 모든 대상 이미지 수집
    const allImgs = Array.from(
      docContainer.querySelectorAll<HTMLImageElement>('img:not(.no-zoom)')
    ).filter((img) => !img.closest('a'))

    if (allImgs.length === 0) return

    const clickedIndex = Math.max(0, allImgs.indexOf(clickedImg))

    const dataSource = allImgs.map((img) => {
      const rect = img.getBoundingClientRect()
      const isSvg = img.src.endsWith('.svg') || img.currentSrc.endsWith('.svg')
      let width = img.naturalWidth
      let height = img.naturalHeight

      // SVG 또는 naturalWidth/Height가 없는 경우 넉넉한 캔버스 크기 부여
      if (!width || !height || (isSvg && width < 1200)) {
        const aspect = rect.width && rect.height ? rect.width / rect.height : 1.5
        width = Math.max(width || 0, Math.round(Math.max(rect.width * 3, 1600)))
        height = Math.round(width / aspect)
      }

      return {
        src: img.currentSrc || img.src,
        width,
        height,
        alt: img.alt || '',
        element: img,
        msrc: img.currentSrc || img.src,
      }
    })

    const { default: PhotoSwipe } = await import('photoswipe')

    const pswp = new PhotoSwipe({
      dataSource,
      index: clickedIndex,
      bgOpacity: 0.88,
      showHideAnimationType: 'zoom',
      wheelToZoom: true,
      maxSpreadZoom: 4,
      closeOnVerticalDrag: true,
      pinchToClose: true,
      doubleTapAction: 'zoom',
    })

    // 이미지 alt 텍스트가 있는 경우 하단에 세련된 캡션 표시
    pswp.on('uiRegister', () => {
      pswp.ui?.registerElement({
        name: 'custom-caption',
        order: 9,
        isButton: false,
        appendTo: 'root',
        onInit: (el) => {
          el.className = 'pswp__custom-caption'
          pswp.on('change', () => {
            const currSlide = pswp.currSlide
            const alt = currSlide?.data?.alt
            el.innerHTML = alt ? `<span class="pswp__caption-text">${alt}</span>` : ''
          })
        },
      })
    })

    pswp.init()
  })
}
