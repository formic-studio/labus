interface MeasureItem {
  details: HTMLDetailsElement;
  summary: HTMLElement;
  panel: HTMLElement;
  copy: HTMLElement;
  motion?: Animation[];
}

const timing: KeyframeAnimationOptions = {
  duration: 300,
  easing: 'cubic-bezier(0.5, 0, 0.5, 1)',
  fill: 'both',
};

export function mount(section: Element, signal: AbortSignal): (() => void) | undefined {
  const items: MeasureItem[] = [];
  for (const details of section.querySelectorAll<HTMLDetailsElement>(
    'details[data-measure-item]',
  )) {
    if (details.closest('[data-component="lci-measure"]') !== section) continue;
    const summary = details.querySelector<HTMLElement>(':scope > summary');
    const panel = details.querySelector<HTMLElement>(':scope > [data-measure-panel]');
    const copy = panel?.querySelector<HTMLElement>(':scope > p');
    if (summary && panel && copy) items.push({ details, summary, panel, copy });
  }
  if (items.length === 0) return;

  const desktopHover = window.matchMedia('(min-width: 992px) and (any-hover: hover)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let selected = items.find(({ details }) => details.open);
  let active = selected;
  let hovered: MeasureItem | undefined;

  function cancel(item: MeasureItem): void {
    for (const animation of item.motion ?? []) animation.cancel();
    item.motion = undefined;
  }

  function settle(item: MeasureItem, expanded: boolean): void {
    cancel(item);
    item.details.open = expanded;
    item.details.removeAttribute('data-measure-closing');
    item.panel.inert = false;
  }

  function animate(item: MeasureItem, expanded: boolean): void {
    const { details, summary, panel, copy } = item;
    if (!expanded && panel.contains(document.activeElement)) summary.focus({ preventScroll: true });

    if (reducedMotion.matches || typeof panel.animate !== 'function') {
      settle(item, expanded);
      return;
    }

    const beforeHeight = details.open ? panel.getBoundingClientRect().height : 0;
    const style = details.open ? getComputedStyle(copy) : null;
    const travel = '0 -0.7rem';
    const before = { opacity: style?.opacity ?? 0, translate: style?.translate ?? travel };
    cancel(item);
    details.open = true;
    details.toggleAttribute('data-measure-closing', !expanded);
    panel.inert = !expanded;

    const height = expanded ? panel.getBoundingClientRect().height : 0;
    const layout = panel.animate(
      [{ height: `${beforeHeight.toFixed(2)}px` }, { height: `${height.toFixed(2)}px` }],
      timing,
    );
    const text = copy.animate(
      [before, { opacity: expanded ? 1 : 0, translate: expanded ? 'none' : travel }],
      timing,
    );
    item.motion = [layout, text];
    layout.addEventListener(
      'finish',
      () => {
        if (item.motion?.[0] === layout) settle(item, expanded);
      },
      { once: true, signal },
    );
  }

  function show(next: MeasureItem | undefined): void {
    if (active === next) return;
    const previous = active;
    active = next;
    if (previous) animate(previous, false);
    if (next) animate(next, true);
  }

  for (const item of items) {
    settle(item, item === selected);
    item.details.addEventListener(
      'pointerenter',
      (event) => {
        if (!desktopHover.matches || event.pointerType !== 'mouse') return;
        hovered = item;
        show(item);
      },
      { signal },
    );
    item.details.addEventListener(
      'pointerleave',
      (event) => {
        if (event.pointerType !== 'mouse' || hovered !== item) return;
        hovered = undefined;
        show(selected);
      },
      { signal },
    );
    item.summary.addEventListener(
      'click',
      (event) => {
        if (event.defaultPrevented) return;
        event.preventDefault();
        if (desktopHover.matches && event.pointerType === 'mouse') return;
        hovered = undefined;
        selected = selected === item ? undefined : item;
        show(selected);
      },
      { signal },
    );
  }

  desktopHover.addEventListener(
    'change',
    () => {
      hovered = undefined;
      show(selected);
    },
    { signal },
  );
  reducedMotion.addEventListener(
    'change',
    (event) => {
      if (event.matches) for (const item of items) settle(item, item === active);
    },
    { signal },
  );

  return () => {
    for (const item of items) settle(item, item === selected);
  };
}
