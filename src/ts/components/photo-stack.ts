export function mount(element: Element, signal: AbortSignal): (() => void) | undefined {
  if (typeof IntersectionObserver === 'undefined' || typeof element.animate !== 'function') {
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cards = Array.from(element.querySelectorAll('[data-photo-stack-card]'));
  if (reducedMotion.matches || cards.length === 0) return;

  const pendingAttribute = 'data-photo-stack-waiting';
  let animations: Animation[] = [];
  const observer = new IntersectionObserver(
    (entries) => {
      if (
        !element.hasAttribute(pendingAttribute) ||
        !entries.some((entry) => entry.isIntersecting)
      ) {
        return;
      }

      observer.disconnect();
      animations = cards.map((card, index) =>
        card.animate(
          [
            { opacity: 0, transform: 'translateY(16%) scale(0.92)' },
            { opacity: 1, transform: 'none' },
          ],
          {
            delay: index * 130,
            duration: 680,
            easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
            fill: 'backwards',
          },
        ),
      );
      element.removeAttribute(pendingAttribute);
    },
    { threshold: 0.16 },
  );

  function finish(): void {
    observer.disconnect();
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
  observer.observe(element);
  return finish;
}
