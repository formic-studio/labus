export function mount(element: Element, signal: AbortSignal): (() => void) | undefined {
  if (!(element instanceof HTMLElement)) return;

  const darkPanel = element.querySelector<HTMLElement>('[data-footer-dark]');
  if (!darkPanel) return;

  const root = element;
  const dark = darkPanel;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;

  function reset(): void {
    root.removeAttribute('data-footer-revealing');
    root.removeAttribute('data-footer-callout-hidden');
    root.style.removeProperty('--footer-dark-lift');
  }

  function update(): void {
    frame = 0;

    if (media.matches) {
      reset();
      return;
    }

    const height = window.innerHeight;
    const entered = height - root.getBoundingClientRect().top;
    const calloutHeight = dark.offsetTop;
    const darkTravel = Math.min(dark.offsetHeight * 0.6, height * 0.28);
    const revealed = Math.max(0, entered - darkTravel);
    const lift = Math.max(0, calloutHeight - revealed);

    if (lift === 0) {
      reset();
      return;
    }

    root.style.setProperty('--footer-dark-lift', `${lift.toFixed(2)}px`);
    root.setAttribute('data-footer-revealing', '');
    root.toggleAttribute('data-footer-callout-hidden', revealed === 0);
  }

  function schedule(): void {
    if (!frame) frame = window.requestAnimationFrame(update);
  }

  const size = new ResizeObserver(schedule);
  size.observe(root);
  size.observe(dark);

  const visibility = new IntersectionObserver(schedule);
  visibility.observe(root);

  window.addEventListener('scroll', schedule, { passive: true, signal });
  window.addEventListener('resize', schedule, { passive: true, signal });
  media.addEventListener('change', schedule, { signal });
  update();

  return () => {
    size.disconnect();
    visibility.disconnect();
    window.cancelAnimationFrame(frame);
    reset();
  };
}
