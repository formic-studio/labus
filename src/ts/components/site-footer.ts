export function mount(element: Element, signal: AbortSignal): (() => void) | undefined {
  if (!(element instanceof HTMLElement)) return;

  const panel = element.querySelector<HTMLElement>('[data-footer-dark]');
  if (!panel || !element.querySelector(':scope > .site-footer-callout')) return;

  const root = element;
  const darkPanel = panel;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visibility: IntersectionObserver | undefined;

  function reset(): void {
    visibility?.disconnect();
    visibility = undefined;
    root.removeAttribute('data-footer-reveal');
    root.removeAttribute('data-footer-callout-hidden');
    root.style.removeProperty('--footer-sticky-bottom');
  }

  function sync(): void {
    if (media.matches) {
      reset();
      return;
    }

    const viewportHeight = window.innerHeight;
    const panelHeight = darkPanel.getBoundingClientRect().height;
    const travel = Math.min(panelHeight * 0.6, viewportHeight * 0.28);
    const calloutVisible = root.getBoundingClientRect().top < viewportHeight - travel;

    // Dolny offset przypina panel z widocznym odcinkiem odsłonięcia.
    root.style.setProperty('--footer-sticky-bottom', `${(travel - panelHeight).toFixed(2)}px`);
    root.setAttribute('data-footer-reveal', '');
    root.toggleAttribute('data-footer-callout-hidden', !calloutVisible);

    visibility?.disconnect();
    visibility = new IntersectionObserver(
      ([entry], observer) => {
        if (observer === visibility && entry) {
          root.toggleAttribute('data-footer-callout-hidden', !entry.isIntersecting);
        }
      },
      { rootMargin: `0px 0px -${travel.toFixed(2)}px 0px` },
    );
    visibility.observe(root);
  }

  const size = new ResizeObserver(sync);
  size.observe(darkPanel, { box: 'border-box' });
  window.addEventListener('resize', sync, { signal });
  media.addEventListener('change', sync, { signal });
  sync();

  return () => {
    size.disconnect();
    reset();
  };
}
