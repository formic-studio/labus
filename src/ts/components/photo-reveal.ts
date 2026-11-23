function mountPhotoReveal(
  frame: HTMLElement,
  image: HTMLImageElement,
  reducedMotion: MediaQueryList,
  signal: AbortSignal,
): (() => void) | undefined {
  if (reducedMotion.matches || (image.complete && image.naturalWidth === 0)) return;

  const trigger = document.createElement('span');
  trigger.className = 'photo-reveal-trigger';
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
      if (event.target === frame && event.animationName === 'photo-reveal') finish();
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

export function mount(element: Element, signal: AbortSignal): (() => void) | undefined {
  const frame = element.matches('[data-component="photo-reveal"]')
    ? element
    : element.querySelector('[data-design-approach-photo]');
  if (!(frame instanceof HTMLElement)) return;

  const image = frame.querySelector('img');
  if (!image) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mountPhotoReveal(frame, image, reducedMotion, signal);
}
