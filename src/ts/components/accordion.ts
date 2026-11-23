interface Disclosure {
  details: HTMLDetailsElement;
  summary: HTMLElement;
  panel: HTMLElement;
  name: string | null;
}

export function mount(element: Element, signal: AbortSignal): (() => void) | undefined {
  if (typeof HTMLElement.prototype.animate !== 'function') return;

  const items: Disclosure[] = [];
  for (const details of element.querySelectorAll<HTMLDetailsElement>(
    ':scope > details[data-accordion-item]',
  )) {
    const summary = details.querySelector<HTMLElement>(':scope > summary');
    const panel = details.querySelector<HTMLElement>(':scope > [data-accordion-panel]');
    if (summary && panel)
      items.push({ details, summary, panel, name: details.getAttribute('name') });
  }
  if (items.length === 0) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Map<Disclosure, Animation>();
  let active = items.find(({ details }) => details.open);

  function settle(item: Disclosure, expanded: boolean): void {
    animations.get(item)?.cancel();
    animations.delete(item);
    item.details.open = expanded;
    item.details.removeAttribute('data-accordion-closing');
    item.panel.removeAttribute('data-accordion-animating');
    item.panel.inert = false;
  }

  for (const item of items) {
    // W trakcie animacji zamykany panel pozostaje otwarty w DOM.
    item.details.removeAttribute('name');
    settle(item, item === active);
  }

  function animate(item: Disclosure, expanded: boolean): void {
    const { details, panel, summary } = item;
    if (!expanded && panel.contains(document.activeElement)) {
      summary.focus({ preventScroll: true });
    }

    if (reducedMotion.matches) {
      settle(item, expanded);
      return;
    }

    const previousHeight = details.open ? panel.getBoundingClientRect().height : 0;
    const previousOpacity = details.open ? getComputedStyle(panel).opacity : '0';
    animations.get(item)?.cancel();

    details.open = true;
    details.toggleAttribute('data-accordion-closing', !expanded);
    panel.inert = !expanded;
    panel.setAttribute('data-accordion-animating', '');
    const height = expanded ? panel.getBoundingClientRect().height : 0;

    const animation = panel.animate(
      [
        { height: `${previousHeight.toFixed(2)}px`, opacity: previousOpacity },
        { height: `${height.toFixed(2)}px`, opacity: expanded ? 1 : 0 },
      ],
      { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' },
    );
    animations.set(item, animation);
    animation.addEventListener(
      'finish',
      () => {
        if (animations.get(item) === animation) settle(item, expanded);
      },
      { once: true, signal },
    );
  }

  element.addEventListener(
    'click',
    (event) => {
      if (event.defaultPrevented || !(event.target instanceof Element)) return;

      const summary = event.target.closest('summary');
      const item = items.find((disclosure) => disclosure.summary === summary);
      if (!item) return;

      event.preventDefault();
      const previous = active;
      active = item === previous ? undefined : item;
      if (previous) animate(previous, false);
      if (active) animate(active, true);
    },
    { signal },
  );

  reducedMotion.addEventListener(
    'change',
    (event) => {
      if (event.matches) {
        for (const item of items) settle(item, item === active);
      }
    },
    { signal },
  );

  return () => {
    for (const item of items) {
      settle(item, item === active);
      if (item.name !== null) item.details.setAttribute('name', item.name);
    }
  };
}
