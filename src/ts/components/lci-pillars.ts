import { scrollHorizontalWithArrowKeys } from '../core/horizontal-scroll';

interface Drag {
  pointerId: number;
  x: number;
  y: number;
  scrollLeft: number;
  active: boolean;
}

const dragThreshold = 6;

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

  return () => {
    if (drag) finish(drag.pointerId);
    viewport.removeAttribute('data-pillars-drag-ready');
  };
}
