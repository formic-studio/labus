export function mount(element: Element, signal: AbortSignal): (() => void) | undefined {
  const mark = element.querySelector(':scope > .lci-mark');
  const pills = Array.from(element.querySelectorAll(':scope > .lci-pill'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!mark || pills.length === 0 || reducedMotion.matches) return;

  const animations: Animation[] = [];
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;

      observer.disconnect();
      element.removeAttribute('data-lci-reveal-pending');

      const shuffledPills = pills
        .map((pill) => ({ pill, order: Math.random() }))
        .sort((first, second) => first.order - second.order)
        .map(({ pill }) => pill);

      for (const [index, item] of [mark, ...shuffledPills].entries()) {
        const animation = item.animate(
          [{ clipPath: 'circle(0% at center)' }, { clipPath: 'circle(72% at center)' }],
          {
            delay: index === 0 ? 0 : 250 + (index - 1) * 180,
            duration: 680,
            easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)',
            fill: 'backwards',
          },
        );
        animations.push(animation);
      }
    },
    { rootMargin: '0px 0px -32px 0px' },
  );

  function stop(): void {
    observer.disconnect();
    element.removeAttribute('data-lci-reveal-pending');
    for (const animation of animations) animation.cancel();
    animations.length = 0;
  }

  element.setAttribute('data-lci-reveal-pending', '');
  observer.observe(element);

  reducedMotion.addEventListener(
    'change',
    (event) => {
      if (event.matches) stop();
    },
    { signal },
  );

  return stop;
}
