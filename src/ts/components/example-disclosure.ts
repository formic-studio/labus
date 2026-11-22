export function mount(element: Element): (() => void) | undefined {
  if (!(element instanceof HTMLDetailsElement)) {
    return;
  }

  const details = element;

  function closeOnEscape(event: KeyboardEvent): void {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.key !== 'Escape' ||
      !details.open ||
      !(event.target instanceof Element) ||
      event.target.closest('details') !== details
    ) {
      return;
    }

    const summary = details.firstElementChild;

    if (!(summary instanceof HTMLElement) || summary.localName !== 'summary') {
      return;
    }

    event.preventDefault();
    summary.focus();
    details.open = false;
  }

  details.addEventListener('keydown', closeOnEscape);

  return () => {
    details.removeEventListener('keydown', closeOnEscape);
  };
}
