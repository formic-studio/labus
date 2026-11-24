import { scrollHorizontalWithArrowKeys } from '../core/horizontal-scroll';

interface Drag {
  pointerId: number;
  x: number;
  y: number;
  scrollLeft: number;
  active: boolean;
}

const dragThreshold = 6;

function mountFlipHint(viewport: HTMLElement, signal: AbortSignal): () => void {
  const desktop = window.matchMedia(
    '(min-width: 992px) and (any-hover: hover) and (any-pointer: fine)',
  );
  const hint = document.createElement('span');
  hint.className = 'lci-pillar-hint';
  hint.textContent = 'odwróć';
  hint.setAttribute('aria-hidden', 'true');

  let pointer: { x: number; y: number } | undefined;
  let frame: number | undefined;
  let activeCard: HTMLDetailsElement | undefined;
  let activeOpen = false;

  function hide(): void {
    activeCard = undefined;
    hint.removeAttribute('data-visible');
  }

  function update(): void {
    frame = undefined;
    if (!pointer || !desktop.matches || viewport.hasAttribute('data-pillars-grabbing')) {
      hide();
      return;
    }

    const { x, y } = pointer;
    const hit = document.elementFromPoint(x, y);
    const card = hit?.closest('summary')?.parentElement;
    if (
      !(card instanceof HTMLDetailsElement) ||
      !card.matches('[data-pillar]') ||
      !viewport.contains(card)
    ) {
      hide();
      return;
    }

    if (!hint.isConnected) document.body.append(hint);
    if (card !== activeCard || card.open !== activeOpen) {
      hint.style.backgroundColor = getComputedStyle(card).getPropertyValue('--pillar-flip-hint');
      activeCard = card;
      activeOpen = card.open;
    }

    const { clientWidth, clientHeight } = document.documentElement;
    const edge = 8;
    const gap = 20;
    const left = Math.max(edge, Math.min(x, clientWidth - hint.offsetWidth - edge));
    const below = y + gap;
    const top =
      below + hint.offsetHeight <= clientHeight - edge ? below : y - hint.offsetHeight - edge;
    hint.style.translate = `${left.toString()}px ${Math.max(edge, top).toString()}px`;
    hint.setAttribute('data-visible', '');
  }

  function schedule(): void {
    if (pointer) frame ??= window.requestAnimationFrame(update);
  }

  function follow(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || !desktop.matches) return;
    pointer = { x: event.clientX, y: event.clientY };
    schedule();
  }

  function clear(): void {
    pointer = undefined;
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    frame = undefined;
    hide();
  }

  for (const type of ['pointerover', 'pointermove', 'pointerup'] as const) {
    viewport.addEventListener(type, follow, { passive: true, signal });
  }
  viewport.addEventListener('pointerleave', clear, { signal });
  viewport.addEventListener('pointercancel', clear, { signal });
  viewport.addEventListener('toggle', schedule, { capture: true, signal });
  window.addEventListener('scroll', schedule, { capture: true, passive: true, signal });
  window.addEventListener('blur', clear, { signal });
  desktop.addEventListener('change', clear, { signal });

  return () => {
    clear();
    hint.remove();
  };
}

export function mount(element: Element, signal: AbortSignal): (() => void) | undefined {
  if (!(element instanceof HTMLElement)) return;
  const viewport = element;
  let drag: Drag | undefined;
  let suppressClick = false;

  function finish(pointerId: number): void {
    if (!drag || drag.pointerId !== pointerId) return;

    suppressClick = drag.active;
    drag = undefined;
    viewport.removeAttribute('data-pillars-grabbing');
    if (viewport.hasPointerCapture(pointerId)) viewport.releasePointerCapture(pointerId);
  }

  viewport.addEventListener(
    'pointerdown',
    (event) => {
      suppressClick = false;
      if (
        drag ||
        event.pointerType !== 'mouse' ||
        event.button !== 0 ||
        viewport.scrollWidth <= viewport.clientWidth
      ) {
        return;
      }

      drag = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        scrollLeft: viewport.scrollLeft,
        active: false,
      };
    },
    { signal },
  );

  viewport.addEventListener(
    'pointermove',
    (event) => {
      if (drag?.pointerId !== event.pointerId) return;
      if (!(event.buttons & 1)) {
        finish(event.pointerId);
        return;
      }

      const distance = event.clientX - drag.x;
      if (!drag.active) {
        if (
          Math.abs(distance) < dragThreshold ||
          Math.abs(distance) <= Math.abs(event.clientY - drag.y)
        ) {
          return;
        }

        viewport.setPointerCapture(event.pointerId);
        viewport.setAttribute('data-pillars-grabbing', '');
        drag.active = true;
      }

      viewport.scrollLeft = drag.scrollLeft - distance;
    },
    { signal },
  );

  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    viewport.addEventListener(
      type,
      (event) => {
        finish(event.pointerId);
      },
      { signal },
    );
  }
  viewport.addEventListener(
    'pointerleave',
    (event) => {
      if (drag && !drag.active) finish(event.pointerId);
    },
    { signal },
  );

  viewport.addEventListener(
    'click',
    (event) => {
      if (suppressClick && event.detail > 0) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
      }
    },
    { capture: true, signal },
  );

  viewport.addEventListener(
    'wheel',
    (event) => {
      if (
        !event.shiftKey ||
        event.ctrlKey ||
        event.deltaX !== 0 ||
        event.deltaY === 0 ||
        !event.cancelable ||
        viewport.scrollWidth <= viewport.clientWidth
      ) {
        return;
      }

      const lineHeight = Number.parseFloat(getComputedStyle(viewport).lineHeight) || 16;
      const unit =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? lineHeight
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? viewport.clientWidth
            : 1;
      event.preventDefault();
      event.stopPropagation();
      viewport.scrollLeft += event.deltaY * unit;
    },
    { passive: false, signal },
  );

  viewport.addEventListener(
    'keydown',
    (event) => {
      scrollHorizontalWithArrowKeys(viewport, event);
    },
    { signal },
  );
  viewport.setAttribute('data-pillars-drag-ready', '');
  const clearFlipHint = mountFlipHint(viewport, signal);

  return () => {
    clearFlipHint();
    if (drag) finish(drag.pointerId);
    viewport.removeAttribute('data-pillars-drag-ready');
  };
}
