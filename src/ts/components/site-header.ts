export function mount(element: Element, signal: AbortSignal): (() => void) | undefined {
  const logo = element.querySelector('[data-header-logo]');
  const menu = element.querySelector('details[data-header-menu]');
  const toggle = menu?.querySelector('summary');
  if (!logo || !(menu instanceof HTMLDetailsElement) || !toggle) return;

  const controls = [logo, toggle];
  let frame = 0;

  function updateColors(): void {
    frame = 0;
    const lightBackgrounds = controls.map((control) => {
      const icon = control.getBoundingClientRect();
      const backdrop = document
        .elementsFromPoint(icon.x + icon.width / 2, icon.y + icon.height / 2)
        .find((target) => !target.closest('[data-component="site-header"]'));

      return (
        backdrop && Number(getComputedStyle(backdrop).getPropertyValue('--header-light')) >= 0.5
      );
    });

    controls.forEach((control, index) => {
      control.toggleAttribute('data-header-ink', Boolean(lightBackgrounds[index]));
    });
  }

  function scheduleColors(): void {
    if (!frame) frame = window.requestAnimationFrame(updateColors);
  }

  window.addEventListener('scroll', scheduleColors, { passive: true, signal });
  window.addEventListener('resize', scheduleColors, { passive: true, signal });
  menu.addEventListener('toggle', scheduleColors, { signal });

  document.addEventListener(
    'click',
    (event) => {
      if (!menu.open || !(event.target instanceof Element)) return;

      const insideMenu = menu.contains(event.target);
      if (!insideMenu || event.target.closest('a[href]')) menu.open = false;
    },
    { signal },
  );

  menu.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape' || !menu.open) return;

      event.preventDefault();
      menu.open = false;
      toggle.focus({ preventScroll: true });
    },
    { signal },
  );

  updateColors();

  return () => {
    window.cancelAnimationFrame(frame);
    for (const control of controls) {
      control.removeAttribute('data-header-ink');
    }
  };
}
