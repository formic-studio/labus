interface Disclosure {
  details: HTMLDetailsElement;
  summary: HTMLElement;
  panel: HTMLElement;
  content: HTMLElement | null;
  name: string | null;
}

const easing = 'cubic-bezier(0.32, 0, 0.2, 1)';

export function mount(element: Element, signal: AbortSignal): (() => void) | undefined {
  if (typeof HTMLElement.prototype.animate !== 'function') return;

  const items: Disclosure[] = [];
  for (const details of element.querySelectorAll<HTMLDetailsElement>(
    ':scope > details[data-accordion-item]',
  )) {
    const summary = details.querySelector<HTMLElement>(':scope > summary');
    const panel = details.querySelector<HTMLElement>(':scope > [data-accordion-panel]');
    if (!summary || !panel) continue;

    const content = panel.querySelector(':scope > :only-child');
    items.push({
      details,
      summary,
      panel,
      content: content instanceof HTMLElement ? content : null,
      name: details.getAttribute('name'),
    });
  }
  if (items.length === 0) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Map<Disclosure, Animation[]>();
  let active = items.find(({ details }) => details.open);

  function cancel(item: Disclosure): void {
    for (const animation of animations.get(item) ?? []) animation.cancel();
    animations.delete(item);
  }

  function settle(item: Disclosure, expanded: boolean): void {
    cancel(item);
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

  function animate(item: Disclosure, expanded: boolean, direction: -1 | 1): void {
    const { details, panel, summary, content } = item;
    if (!expanded && panel.contains(document.activeElement)) {
      summary.focus({ preventScroll: true });
    }

    if (reducedMotion.matches) {
      settle(item, expanded);
      return;
    }

    const wasOpen = details.open;
    const previousHeight = wasOpen ? panel.getBoundingClientRect().height : 0;
    const contentStyle = wasOpen && content ? getComputedStyle(content) : null;
    const travel = 'var(--accordion-content-travel, 4rem)';
    const from = {
      opacity: contentStyle?.opacity ?? 0,
      translate: contentStyle?.translate ?? `0 calc(${travel} * ${String(-direction)})`,
    };
    cancel(item);

    details.open = true;
    details.toggleAttribute('data-accordion-closing', !expanded);
    panel.inert = !expanded;
    panel.setAttribute('data-accordion-animating', '');
    const height = expanded ? panel.getBoundingClientRect().height : 0;

    const duration = expanded ? 468 : 360;
    const layout = panel.animate(
      [{ height: `${previousHeight.toFixed(2)}px` }, { height: `${height.toFixed(2)}px` }],
      { duration, easing, fill: 'both' },
    );
    const motion = [layout];

    if (content) {
      const delay = expanded && !wasOpen ? 60 : 0;
      motion.push(
        content.animate(
          [
            from,
            {
              opacity: expanded ? 1 : 0,
              translate: expanded ? 'none' : `0 calc(${travel} * ${String(direction)})`,
            },
          ],
          { delay, duration: expanded ? duration - delay : 240, easing, fill: 'both' },
        ),
      );
    }

    animations.set(item, motion);
    layout.addEventListener(
      'finish',
      () => {
        if (animations.get(item) === motion) settle(item, expanded);
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
      const direction =
        previous && active && items.indexOf(active) > items.indexOf(previous) ? 1 : -1;
      if (previous) animate(previous, false, direction);
      if (active) animate(active, true, previous ? direction : 1);
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
