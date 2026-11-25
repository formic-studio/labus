const entriesPerPage = 11;

export function mount(element: Element, signal: AbortSignal): (() => void) | undefined {
  const groups = Array.from(
    element.querySelectorAll<HTMLDetailsElement>('[data-achievement-group]'),
    (details) => ({
      details,
      entries: Array.from(details.querySelectorAll<HTMLElement>('[data-achievement-entry]')),
    }),
  );
  const pagination = element.querySelector<HTMLElement>('[data-achievements-pagination]');
  const previous = pagination?.querySelector<HTMLButtonElement>('[data-achievements-prev]');
  const next = pagination?.querySelector<HTMLButtonElement>('[data-achievements-next]');
  const status = pagination?.querySelector<HTMLElement>('[data-achievements-page]');
  if (!groups.length || !pagination || !previous || !next || !status) return;

  const desktop = window.matchMedia('(min-width: 992px)');
  const entryCount = groups.reduce((total, group) => total + group.entries.length, 0);
  const pageCount = Math.max(1, Math.ceil(entryCount / entriesPerPage));
  let page = 0;
  let mobileOpen: boolean[] | undefined;

  function showEntries(): void {
    const start = page * entriesPerPage;
    const end = start + entriesPerPage;
    let index = 0;
    for (const { details, entries } of groups) {
      let visible = false;
      for (const entry of entries) {
        entry.hidden = desktop.matches && (index < start || index >= end);
        visible ||= !entry.hidden;
        index += 1;
      }
      details.hidden = !visible;
    }
  }

  const showPage = (): void => {
    showEntries();
    status.textContent = `${String(page + 1)} / ${String(pageCount)}`;
    previous.setAttribute('aria-disabled', String(page === 0));
    next.setAttribute('aria-disabled', String(page === pageCount - 1));
  };

  function restoreGroups(): void {
    if (!mobileOpen) return;
    const openStates = mobileOpen;
    groups.forEach(({ details }, index) => {
      details.open = openStates[index] ?? false;
    });
    mobileOpen = undefined;
  }

  const syncLayout = (): void => {
    element.toggleAttribute('data-achievements-desktop', desktop.matches);
    if (desktop.matches) {
      mobileOpen ??= groups.map(({ details }) => details.open);
      groups.forEach(({ details }) => {
        details.open = true;
      });
    } else {
      restoreGroups();
    }
    pagination.hidden = !desktop.matches || pageCount < 2;
    showPage();
  };

  previous.addEventListener(
    'click',
    () => {
      if (page === 0) return;
      page -= 1;
      showPage();
    },
    { signal },
  );
  next.addEventListener(
    'click',
    () => {
      if (page === pageCount - 1) return;
      page += 1;
      showPage();
    },
    { signal },
  );
  desktop.addEventListener('change', syncLayout, { signal });
  syncLayout();

  return () => {
    restoreGroups();
    element.removeAttribute('data-achievements-desktop');
    pagination.hidden = true;
    for (const { details, entries } of groups) {
      details.hidden = false;
      entries.forEach((entry) => {
        entry.hidden = false;
      });
    }
  };
}
