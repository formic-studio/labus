import { scrollHorizontalWithArrowKeys } from '../core/horizontal-scroll';

const speed = 44;
const readyAttribute = 'data-logo-marquee-ready';
const playingAttribute = 'data-logo-marquee-playing';

export function mount(element: Element, signal: AbortSignal): (() => void) | undefined {
  const viewport = element.querySelector<HTMLElement>('[data-logo-marquee-viewport]');
  const track = viewport?.querySelector<HTMLElement>('[data-logo-marquee-track]');
  const group = track?.querySelector<HTMLElement>('[data-logo-marquee-group]');
  const toggle = element.querySelector<HTMLButtonElement>('button[data-logo-marquee-toggle]');

  if (!viewport || !track || !group?.children.length || !toggle) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const initialTabIndex = viewport.getAttribute('tabindex');
  const startLabel = toggle.textContent;
  const copies: HTMLElement[] = [];
  let visible = false;
  let paused = false;

  const syncPlayback = () => {
    viewport.toggleAttribute(
      playingAttribute,
      viewport.hasAttribute(readyAttribute) && visible && !paused,
    );
  };

  const restoreStaticLayout = () => {
    viewport.removeAttribute(readyAttribute);
    viewport.removeAttribute(playingAttribute);
    if (initialTabIndex !== null) viewport.setAttribute('tabindex', initialTabIndex);
    track.style.removeProperty('--logo-marquee-offset');
    track.style.removeProperty('--logo-marquee-duration');
    for (const copy of copies.splice(0)) copy.remove();
    toggle.hidden = true;
  };

  const syncLayout = () => {
    const distance = group.getBoundingClientRect().width;
    if (reducedMotion.matches || !distance || !viewport.clientWidth) {
      restoreStaticLayout();
      return;
    }

    // Każda kopia zachowuje odstęp na końcu listy i wypełnia widoczną część podczas pełnego obrotu.
    const count = Math.ceil(viewport.clientWidth / distance);
    while (copies.length < count) {
      const copy = group.cloneNode(true);
      if (!(copy instanceof HTMLElement)) break;

      copy.inert = true;
      copy.setAttribute('aria-hidden', 'true');
      copy.removeAttribute('id');
      for (const node of copy.querySelectorAll('[id]')) node.removeAttribute('id');
      track.append(copy);
      copies.push(copy);
    }
    for (const copy of copies.splice(count)) copy.remove();

    track.style.setProperty('--logo-marquee-offset', `${(-distance).toFixed(3)}px`);
    track.style.setProperty('--logo-marquee-duration', `${(distance / speed).toFixed(3)}s`);

    if (!viewport.hasAttribute(readyAttribute)) {
      viewport.scrollLeft = 0;
      viewport.setAttribute(readyAttribute, '');
      viewport.removeAttribute('tabindex');
    }

    toggle.hidden = false;
    syncPlayback();
  };

  toggle.addEventListener(
    'click',
    () => {
      paused = !paused;
      toggle.textContent = paused ? 'Wznów przewijanie' : startLabel;
      syncPlayback();
    },
    { signal },
  );

  viewport.addEventListener(
    'keydown',
    (event) => {
      if (!viewport.hasAttribute(readyAttribute)) scrollHorizontalWithArrowKeys(viewport, event);
    },
    { signal },
  );

  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    syncPlayback();
  });
  visibility.observe(viewport);

  const resize = new ResizeObserver(syncLayout);
  resize.observe(viewport);
  resize.observe(group);
  reducedMotion.addEventListener('change', syncLayout, { signal });
  syncLayout();

  return () => {
    visibility.disconnect();
    resize.disconnect();
    restoreStaticLayout();
    toggle.textContent = startLabel;
  };
}
