export function scrollHorizontalWithArrowKeys(element: HTMLElement, event: KeyboardEvent): void {
  if (
    event.target !== element ||
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
  ) {
    return;
  }

  event.preventDefault();
  const direction = event.key === 'ArrowRight' ? 1 : -1;
  element.scrollBy({ left: (element.clientWidth / 4) * direction });
}
