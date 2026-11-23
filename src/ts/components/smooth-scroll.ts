import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const navigationKeys = new Set([
  'ArrowDown',
  'ArrowUp',
  'End',
  'Home',
  'PageDown',
  'PageUp',
  'Tab',
  ' ',
]);

export function mount(_element: Element, signal: AbortSignal): () => void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let scroll: Lenis | undefined;

  function destroy(): void {
    scroll?.destroy();
    scroll = undefined;
  }

  function sync(): void {
    if (reducedMotion.matches) {
      destroy();
      return;
    }

    scroll ??= new Lenis({
      autoRaf: true,
      lerp: 0.26,
      allowNestedScroll: true,
    });
  }

  function releaseScroll(): void {
    if (scroll?.isScrolling === 'smooth') {
      scroll.stop();
      scroll.start();
    }
  }

  window.addEventListener(
    'keydown',
    (event) => {
      if (navigationKeys.has(event.key)) releaseScroll();
    },
    { capture: true, signal },
  );
  window.addEventListener(
    'click',
    (event) => {
      if (event.target instanceof Element && event.target.closest('a[href]')) releaseScroll();
    },
    { capture: true, signal },
  );
  reducedMotion.addEventListener('change', sync, { signal });
  sync();

  return destroy;
}
