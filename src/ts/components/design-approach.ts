function mountPhotoReveal(
  frame: HTMLElement,
  image: HTMLImageElement,
  reducedMotion: MediaQueryList,
  signal: AbortSignal,
): (() => void) | undefined {
  if (reducedMotion.matches || (image.complete && image.naturalWidth === 0)) return;

  const trigger = document.createElement('span');
  trigger.className = 'design-approach-reveal-trigger';
  trigger.setAttribute('aria-hidden', 'true');
  let centerVisible = false;

  function reveal(): void {
    if (
      !centerVisible ||
      !image.complete ||
      !image.naturalWidth ||
      frame.dataset.photoReveal !== 'pending'
    ) {
      return;
    }

    observer.disconnect();
    trigger.remove();
    frame.dataset.photoReveal = 'playing';
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      centerVisible = entry?.isIntersecting ?? false;
      reveal();
    },
    { rootMargin: '0px 0px -16px 0px' },
  );

  function finish(): void {
    observer.disconnect();
    trigger.remove();
    delete frame.dataset.photoReveal;
  }

  frame.dataset.photoReveal = 'pending';
  frame.append(trigger);
  observer.observe(trigger);

  image.addEventListener('load', reveal, { signal });
  image.addEventListener('error', finish, { signal });
  frame.addEventListener(
    'animationend',
    (event) => {
      if (event.target === frame && event.animationName === 'design-approach-reveal') finish();
    },
    { signal },
  );
  reducedMotion.addEventListener(
    'change',
    (event) => {
      if (event.matches) finish();
    },
    { signal },
  );

  return finish;
}

function edgeOrigin(button: HTMLElement, event: PointerEvent): string {
  const box = button.getBoundingClientRect();
  const x = Math.max(0, Math.min(box.width, event.clientX - box.left));
  const y = Math.max(0, Math.min(box.height, event.clientY - box.top));
  const horizontal = Math.min(x, box.width - x);
  const vertical = Math.min(y, box.height - y);

  if (horizontal <= vertical) {
    const side = x <= box.width / 2 ? '0%' : '100%';
    return `${side} ${((y / box.height) * 100).toFixed(2)}%`;
  }

  const side = y <= box.height / 2 ? '0%' : '100%';
  return `${((x / box.width) * 100).toFixed(2)}% ${side}`;
}

function mountDirectionalFill(
  button: HTMLElement,
  reducedMotion: MediaQueryList,
  signal: AbortSignal,
): () => void {
  const fill = document.createElement('span');
  fill.className = 'design-approach-cta-fill';
  fill.setAttribute('aria-hidden', 'true');
  fill.textContent = button.textContent.trim();
  let animation: Animation | undefined;

  function clear(): void {
    animation?.cancel();
    animation = undefined;
    fill.style.removeProperty('clip-path');
    fill.remove();
    button.removeAttribute('data-directional-fill');
  }

  function animate(event: PointerEvent, entering: boolean): void {
    if (event.pointerType !== 'mouse' || reducedMotion.matches) return;

    if (!fill.isConnected) {
      if (!entering) return;
      button.append(fill);
      button.setAttribute('data-directional-fill', '');
    }

    const origin = edgeOrigin(button, event);
    const empty = `circle(0% at ${origin})`;
    const full = `circle(145% at ${origin})`;
    const start =
      animation?.playState === 'running' || !entering ? getComputedStyle(fill).clipPath : empty;
    const end = entering ? full : empty;

    animation?.cancel();
    fill.style.clipPath = end;
    animation = fill.animate([{ clipPath: start }, { clipPath: end }], {
      duration: entering ? 420 : 360,
      easing: 'cubic-bezier(0.25, 0.65, 0.3, 1)',
    });
  }

  button.addEventListener(
    'pointerenter',
    (event) => {
      animate(event, true);
    },
    { signal },
  );
  button.addEventListener(
    'pointerleave',
    (event) => {
      animate(event, false);
    },
    { signal },
  );
  reducedMotion.addEventListener(
    'change',
    (event) => {
      if (event.matches) clear();
    },
    { signal },
  );

  return clear;
}

export function mount(element: Element, signal: AbortSignal): (() => void) | undefined {
  const frame = element.querySelector<HTMLElement>('[data-design-approach-photo]');
  const image = frame?.querySelector('img');
  const button = element.querySelector<HTMLElement>('[data-design-approach-cta]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clearPhoto =
    frame && image ? mountPhotoReveal(frame, image, reducedMotion, signal) : undefined;
  const clearButton = button ? mountDirectionalFill(button, reducedMotion, signal) : undefined;

  return () => {
    clearPhoto?.();
    clearButton?.();
  };
}
