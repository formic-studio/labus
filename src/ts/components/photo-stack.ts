const CARD_DURATION_MS = 540;
const CARD_STAGGER_MS = 300;

export function mount(element: Element, signal: AbortSignal): (() => void) | undefined {
  if (typeof IntersectionObserver === 'undefined' || typeof element.animate !== 'function') {
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cards = Array.from(element.querySelectorAll('[data-photo-stack-card]'));
  if (reducedMotion.matches || cards.length === 0) return;

  const pendingAttribute = 'data-photo-stack-waiting';
  let animations: Animation[] = [];
  let observer: IntersectionObserver | undefined;
  let revealMargin: string | undefined;
  const resizeObserver =
    typeof ResizeObserver === 'function' ? new ResizeObserver(observe) : undefined;

  function stopObserving(): void {
    observer?.disconnect();
    observer = undefined;
    resizeObserver?.disconnect();
    window.removeEventListener('resize', observe);
  }

  function play(): void {
    stopObserving();
    animations = cards.map((card, index) =>
      card.animate(
        [
          { opacity: 0, transform: 'translateY(16%) scale(0.92)' },
          { opacity: 1, transform: 'none' },
        ],
        {
          delay: index * CARD_STAGGER_MS,
          duration: CARD_DURATION_MS,
          easing: 'cubic-bezier(0.25, 0, 0.25, 1)',
          fill: 'backwards',
        },
      ),
    );
    element.removeAttribute(pendingAttribute);
  }

  function observe(): void {
    if (!element.hasAttribute(pendingAttribute)) return;

    const { height } = element.getBoundingClientRect();
    const viewportHeight = document.documentElement.clientHeight;
    if (height <= 0 || viewportHeight <= 0) return;

    // Jeśli stos się mieści, zostaw miejsce na wejście kart od dołu.
    const spareHeight = viewportHeight - height;
    const bottomInset = Math.floor(Math.min(height * 0.12, Math.max(0, spareHeight / 2)));
    // W niskim oknie czekamy na dół stosu i co najmniej 90% wypełnienia ekranu.
    const topMargin = spareHeight < 0 ? Math.ceil(height - viewportHeight * 0.9) : 0;
    const rootMargin = `${String(topMargin)}px 0px ${String(-bottomInset)}px`;
    if (rootMargin === revealMargin) return;

    revealMargin = rootMargin;
    observer?.disconnect();
    observer = new IntersectionObserver(
      (entries, source) => {
        const entry = entries.at(-1);
        if (source === observer && entry?.isIntersecting && entry.intersectionRatio === 1) {
          play();
        }
      },
      { rootMargin, threshold: 1 },
    );
    observer.observe(element);
  }

  function finish(): void {
    stopObserving();
    element.removeAttribute(pendingAttribute);
    for (const animation of animations) animation.cancel();
    animations = [];
  }

  reducedMotion.addEventListener(
    'change',
    (event) => {
      if (event.matches) finish();
    },
    { signal },
  );

  element.setAttribute(pendingAttribute, '');
  resizeObserver?.observe(element);
  window.addEventListener('resize', observe, { signal });
  observe();
  return finish;
}
