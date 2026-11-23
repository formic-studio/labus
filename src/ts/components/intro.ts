const scrambleAlphabet = 'abcdefghijklmnoprstuwxyz';
const cardRotations = [-4, 6, -6, 4] as const;

function clampProgress(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function easeInOut(value: number): number {
  return value < 0.5 ? 2 * value ** 2 : 1 - (-2 * value + 2) ** 2 / 2;
}

function easeOut(value: number): number {
  return 1 - (1 - value) ** 2;
}

function scrambleText(start: string, end: string, progress: number): string {
  if (progress <= 0.02) return start;
  if (progress >= 0.98) return end;

  const locked = Math.floor(progress * end.length);
  let text = end.slice(0, locked);

  for (let index = locked; index < end.length; index++) {
    if (index > locked + 1) {
      text += start.charAt(index) || ' ';
      continue;
    }

    const letter = (Math.floor(progress * 60) + index * 3) % scrambleAlphabet.length;
    text += end.charAt(index) === ' ' ? ' ' : scrambleAlphabet.charAt(letter);
  }

  return text.trimEnd();
}

export function mount(element: Element, signal: AbortSignal): (() => void) | undefined {
  if (!(element instanceof HTMLElement)) return;
  const root = element;

  const stage = element.querySelector<HTMLElement>('[data-intro-stage]');
  const phrase = element.querySelector<HTMLElement>('[data-intro-phrase]');
  const parts = phrase?.querySelectorAll<HTMLElement>('[data-intro-phrase-part]');
  const start = parts?.[0]?.textContent.trim();
  const end = parts?.[1]?.textContent.trim();
  const deck = element.querySelector<HTMLElement>('[data-intro-deck]');
  const title = element.querySelector<HTMLElement>('[data-intro-title]');
  const subtitle = element.querySelector<HTMLElement>('[data-intro-subtitle]');
  const cards = Array.from(deck?.querySelectorAll<HTMLElement>('[data-intro-card]') ?? []);

  if (!stage || !phrase || !start || !end || !deck || !title || !subtitle || cards.length !== 4) {
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 992px) and (min-height: 640px)');
  const visualPhrase = document.createElement('span');
  visualPhrase.setAttribute('aria-hidden', 'true');
  visualPhrase.textContent = start;

  let frame: number | undefined;
  let layoutDirty = true;
  const measureStage = () => {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const cardWidth = deck.offsetWidth;
    const cardHeight = deck.offsetHeight;
    const gap = Number.parseFloat(getComputedStyle(deck).columnGap);
    const clearHeight = (height - cardHeight) / 2;
    const range = root.clientHeight - height;

    // Keep the static layout if enlarged text would overlap the deck.
    if (
      !cardWidth ||
      range <= 0 ||
      !Number.isFinite(gap) ||
      clearHeight < height * 0.1 + title.offsetHeight + gap ||
      clearHeight < height * 0.08 + subtitle.offsetHeight + gap
    ) {
      return;
    }

    const scale = Math.max(cardWidth / width, cardHeight / height);

    return {
      cardStep: cardWidth + gap,
      cropX: Math.max(0, (width - cardWidth / scale) / 2),
      cropY: Math.max(0, (height - cardHeight / scale) / 2),
      scale,
      range,
    };
  };
  let geometry: ReturnType<typeof measureStage>;
  let previousProgress: number | undefined;

  const sceneProperties = [
    '--intro-paper-opacity',
    '--intro-photo-scale',
    '--intro-photo-clip',
    '--intro-backdrop-progress',
    '--intro-copy-opacity',
    '--intro-titles-opacity',
    '--intro-deck-opacity',
  ];

  function paintScene(progress: number, scene: NonNullable<typeof geometry>): void {
    const shrink = clampProgress((progress - 0.28) / 0.3);
    const crop = easeInOut(shrink);
    const scale = 1 - (1 - scene.scale) * crop;
    const spread = easeInOut(clampProgress((progress - 0.58) / 0.42));
    const reveal = clampProgress((progress - 0.72) / 0.28);
    const style = root.style;

    style.setProperty('--intro-paper-opacity', String(crop));
    style.setProperty('--intro-photo-scale', String(scale));
    const cropY = (scene.cropY * crop).toFixed(2);
    const cropX = (scene.cropX * crop).toFixed(2);
    const radiusScale = (crop / scale).toFixed(4);
    style.setProperty(
      '--intro-photo-clip',
      `inset(${cropY}px ${cropX}px round calc(${radiusScale} * var(--intro-card-radius)))`,
    );
    style.setProperty('--intro-backdrop-progress', String(crop));
    style.setProperty('--intro-copy-opacity', String(clampProgress(1 - shrink * 2.5)));
    style.setProperty('--intro-titles-opacity', String(easeOut(shrink)));
    style.setProperty('--intro-deck-opacity', String(clampProgress(spread * 10)));

    cards.forEach((card, index) => {
      const slot = index < 2 ? index - 2 : index - 1;
      const rotation = (cardRotations[index] ?? 0) * (1 - spread);
      const stagger = index * 0.1;
      const textOpacity = easeOut(clampProgress((reveal - stagger) / (1 - stagger)));

      card.style.setProperty('--intro-card-x', `${(scene.cardStep * slot * spread).toFixed(2)}px`);
      card.style.setProperty('--intro-card-rotation', `${rotation.toFixed(2)}deg`);
      card.style.setProperty('--intro-card-content-opacity', String(textOpacity));
      card.style.setProperty(
        '--intro-card-content-y',
        `${(1.6 * (1 - textOpacity)).toFixed(3)}rem`,
      );
    });
  }

  function resetScene(): void {
    const style = root.style;
    sceneProperties.forEach((property) => style.removeProperty(property));
    cards.forEach((card) => {
      card.style.removeProperty('--intro-card-x');
      card.style.removeProperty('--intro-card-rotation');
      card.style.removeProperty('--intro-card-content-opacity');
      card.style.removeProperty('--intro-card-content-y');
    });
  }

  const update = () => {
    frame = undefined;

    if (layoutDirty) {
      layoutDirty = false;
      previousProgress = undefined;
      const wasPinned = Boolean(geometry);
      const shouldPin = desktop.matches && !reducedMotion.matches;

      if (reducedMotion.matches) {
        element.removeAttribute('data-intro-motion');
        visualPhrase.remove();
      } else {
        if (!visualPhrase.isConnected) phrase.append(visualPhrase);
        element.setAttribute('data-intro-motion', shouldPin ? 'pinned' : 'text');
      }

      geometry = shouldPin ? measureStage() : undefined;
      if (shouldPin && !geometry) element.setAttribute('data-intro-motion', 'text');
      if (wasPinned && !geometry) resetScene();
    }

    if (reducedMotion.matches) return;

    const distance = -element.getBoundingClientRect().top;
    const progress = geometry ? clampProgress(distance / geometry.range) : 0;
    const textProgress = geometry ? clampProgress(progress / 0.18) : clampProgress(distance / 150);
    const text = scrambleText(start, end, textProgress);

    if (visualPhrase.textContent !== text) visualPhrase.textContent = text;
    if (geometry && progress !== previousProgress) {
      paintScene(progress, geometry);
      previousProgress = progress;
    }
  };

  function schedule(): void {
    frame ??= window.requestAnimationFrame(update);
  }

  function invalidateLayout(): void {
    layoutDirty = true;
    schedule();
  }

  window.addEventListener('scroll', schedule, { passive: true, signal });
  window.addEventListener('resize', invalidateLayout, { signal });
  reducedMotion.addEventListener('change', invalidateLayout, { signal });
  document.fonts.addEventListener('loadingdone', invalidateLayout, { signal });
  update();

  return () => {
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    element.removeAttribute('data-intro-motion');
    visualPhrase.remove();
    resetScene();
  };
}
