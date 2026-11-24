interface BenefitReveal {
  row: HTMLDetailsElement;
  label: HTMLElement;
  typed: HTMLElement;
  letters: string[];
  start: number;
  visible: number;
}

const letterInterval = 25;
const typingDelay = 115;
const rowStagger = 70;

export function mount(section: Element, signal: AbortSignal): (() => void) | undefined {
  const staticView = window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)');
  if (staticView.matches || typeof IntersectionObserver !== 'function') return;

  const list = section.querySelector('[data-benefits-list]');
  if (!list) return;

  const items = new Map<Element, BenefitReveal>();
  const running = new Set<BenefitReveal>();
  let frame: number | undefined;

  function finish(item: BenefitReveal, skipMotion: boolean): void {
    running.delete(item);
    item.label.removeAttribute('data-benefits-typing');
    item.typed.remove();
    if (skipMotion) item.row.removeAttribute('data-benefits-reveal');
  }

  function update(time: number): void {
    frame = undefined;

    for (const item of running) {
      const elapsed = time - item.start;
      if (elapsed < 0) continue;

      if (item.row.dataset.benefitsReveal === 'pending') item.row.dataset.benefitsReveal = 'shown';
      const length = Math.max(0, Math.floor((elapsed - typingDelay) / letterInterval) + 1);
      if (length >= item.letters.length) {
        finish(item, false);
      } else if (length !== item.visible) {
        item.visible = length;
        item.typed.textContent = item.letters.slice(0, length).join('');
      }
    }

    if (running.size) frame = window.requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      let delay = 0;
      // Animate newly visible rows in document order, also when several enter at once.
      for (const item of items.values()) {
        if (item.row.dataset.benefitsReveal !== 'pending') continue;
        if (!entries.some(({ target, isIntersecting }) => target === item.row && isIntersecting)) {
          continue;
        }

        observer.unobserve(item.row);
        item.start = performance.now() + delay;
        running.add(item);
        delay += rowStagger;
      }

      if (running.size) frame ??= window.requestAnimationFrame(update);
    },
    { threshold: 0.2 },
  );

  for (const row of list.querySelectorAll<HTMLDetailsElement>(
    ':scope > details[data-accordion-item]',
  )) {
    const label = row.querySelector<HTMLElement>(':scope > summary > [data-benefits-label]');
    const text = label?.textContent.trim();
    if (!label || !text || row.open || row.matches(':focus-within')) continue;

    const typed = document.createElement('span');
    typed.setAttribute('aria-hidden', 'true');
    typed.setAttribute('data-benefits-typed', '');
    label.append(typed);

    const item = { row, label, typed, letters: Array.from(text), start: 0, visible: 0 };
    items.set(row, item);
    label.setAttribute('data-benefits-typing', '');
    row.dataset.benefitsReveal = 'pending';
    observer.observe(row);

    const revealImmediately = () => {
      observer.unobserve(row);
      finish(item, true);
    };
    row.addEventListener('focusin', revealImmediately, { once: true, signal });
    row.addEventListener('click', revealImmediately, { once: true, signal });
  }

  function clear(): void {
    observer.disconnect();
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    for (const item of items.values()) finish(item, true);
    items.clear();
  }

  staticView.addEventListener(
    'change',
    (event) => {
      if (event.matches) clear();
    },
    { signal },
  );
  return clear;
}
