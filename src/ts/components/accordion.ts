interface Disclosure {
  details: HTMLDetailsElement;
  summary: HTMLElement;
  panel: HTMLElement;
  content: HTMLElement | null;
  name: string | null;
}

interface PanelLayout {
  open: boolean;
  summaryMinSize: string;
  summaryHeight: number;
  rowHeight: number;
  copyTop: number;
  opacity: string;
  translate: string;
}

const disclosureEasing = 'cubic-bezier(0.32, 0, 0.2, 1)';
const defaultSwitchEasing = 'cubic-bezier(0.7, -0.4, 0.4, 1.4)';

function measure({ details, summary, content }: Disclosure): PanelLayout {
  const summaryBox = summary.getBoundingClientRect();
  const copy = details.open ? content : null;
  const style = copy ? getComputedStyle(copy) : null;

  return {
    open: details.open,
    summaryMinSize: getComputedStyle(summary).minBlockSize,
    summaryHeight: summaryBox.height,
    rowHeight: details.getBoundingClientRect().height,
    copyTop: (copy?.getBoundingClientRect().top ?? summaryBox.bottom) + window.scrollY,
    opacity: style?.opacity ?? '0',
    translate: style?.translate ?? 'none',
  };
}

function translateY(value: number): string {
  return `0px ${value.toFixed(2)}px`;
}

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

  const switchEasing =
    getComputedStyle(element).getPropertyValue('--accordion-switch-easing').trim() ||
    defaultSwitchEasing;
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

  function animate(
    item: Disclosure,
    before: PanelLayout,
    after: PanelLayout,
    layoutTiming: { duration: number; easing: string; fill: 'both' },
    copyMotion: { start: string; end: string; exchange: boolean },
  ): void {
    const { details, panel, summary, content } = item;
    const expanded = after.open;
    details.open = true;
    details.toggleAttribute('data-accordion-closing', !expanded);
    panel.inert = !expanded;
    panel.setAttribute('data-accordion-animating', '');
    // Animuj cały wiersz. Wysokość samego panelu zatrzymałaby się na zerze podczas zamachu.
    const layout = details.animate(
      [
        { height: `${before.rowHeight.toFixed(2)}px` },
        { height: `${after.rowHeight.toFixed(2)}px` },
      ],
      layoutTiming,
    );
    const motion = [layout];

    if (before.summaryMinSize !== after.summaryMinSize) {
      motion.push(
        summary.animate(
          [{ minBlockSize: before.summaryMinSize }, { minBlockSize: after.summaryMinSize }],
          layoutTiming,
        ),
      );
    }

    if (content) {
      const opacity = expanded ? after.opacity : '0';
      if (copyMotion.exchange) {
        // Zachowaj widoczny zamach. Opisy przenikają się dopiero, gdy mija je krawędź panelu.
        motion.push(
          content.animate(
            [{ translate: copyMotion.start }, { translate: copyMotion.end }],
            layoutTiming,
          ),
          content.animate(
            [
              { opacity: before.opacity, offset: 0 },
              { opacity: before.opacity, offset: expanded ? 0.42 : 0.33 },
              { opacity, offset: expanded ? 0.71 : 0.66 },
              { opacity, offset: 1 },
            ],
            { duration: layoutTiming.duration, fill: 'both' },
          ),
        );
      } else {
        const delay = expanded && !before.open ? 60 : 0;
        motion.push(
          content.animate(
            [
              { opacity: before.opacity, translate: copyMotion.start },
              { opacity, translate: copyMotion.end },
            ],
            {
              delay,
              duration: expanded ? layoutTiming.duration - delay : 240,
              easing: disclosureEasing,
              fill: 'both',
            },
          ),
        );
      }
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

  function select(next: Disclosure | undefined): void {
    const previous = active;
    active = next;
    if (previous?.panel.contains(document.activeElement)) {
      previous.summary.focus({ preventScroll: true });
    }

    const affected = items.filter(
      (item) => item === previous || item === next || animations.has(item),
    );
    if (reducedMotion.matches) {
      for (const item of affected) settle(item, item === next);
      return;
    }

    const starts = affected.map((item) => ({ item, before: measure(item) }));
    for (const item of affected) settle(item, item === next);
    const frames = starts.map(({ item, before }) => ({ item, before, after: measure(item) }));

    const outgoing = frames.find(({ item }) => item === previous);
    const incoming = frames.find(({ item }) => item === next);
    const switching = Boolean(outgoing && incoming);
    let travel = 0;
    if (outgoing && incoming) {
      const direction = items.indexOf(incoming.item) > items.indexOf(outgoing.item) ? 1 : -1;
      // Sąsiednie opisy pokonują tę samą drogę w widoku, niezależnie od zmiany wysokości wierszy.
      const distance = Math.abs(incoming.after.copyTop - outgoing.before.copyTop);
      const maxTravel = Math.max(outgoing.after.summaryHeight, incoming.before.summaryHeight);
      travel = direction * Math.min(distance, maxTravel);
    }

    for (const { item, before, after } of frames) {
      const exchange = switching && (item === previous || item === next);
      const offset = '0 calc(-1 * var(--accordion-content-travel, 4rem))';
      const start = before.open
        ? before.translate
        : exchange
          ? translateY(after.copyTop - travel - before.copyTop)
          : offset;
      const end = after.open
        ? after.translate
        : exchange
          ? translateY(before.copyTop + travel - after.copyTop)
          : offset;
      const duration = switching ? 400 : after.open ? 468 : 360;
      const easing = switching ? switchEasing : disclosureEasing;
      animate(item, before, after, { duration, easing, fill: 'both' }, { start, end, exchange });
    }
  }

  element.addEventListener(
    'click',
    (event) => {
      if (event.defaultPrevented || !(event.target instanceof Element)) return;

      const summary = event.target.closest('summary');
      const item = items.find((disclosure) => disclosure.summary === summary);
      if (!item) return;

      event.preventDefault();
      select(item === active ? undefined : item);
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
