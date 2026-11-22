type Cleanup = () => void;

interface ComponentModule {
  mount(element: Element, signal: AbortSignal): Cleanup | undefined;
}

export interface ComponentDefinition {
  readonly name: string;
  readonly selector: string;
  readonly load: () => Promise<ComponentModule>;
}

interface Instance {
  controller: AbortController;
  cleanup?: Cleanup;
}

interface Component extends ComponentDefinition {
  instances: Map<Element, Instance>;
  module?: Promise<ComponentModule | undefined>;
}

export function createComponentRegistry(
  document: Document,
  definitions: readonly ComponentDefinition[],
) {
  const components: Component[] = definitions.map((definition) => ({
    ...definition,
    instances: new Map(),
  }));

  function unmount(component: Component, element: Element, instance: Instance): void {
    component.instances.delete(element);
    instance.controller.abort();

    try {
      instance.cleanup?.();
    } catch (error) {
      console.error(`[Labus] Błąd sprzątania komponentu ${component.name}.`, error);
    }
  }

  function prune(): void {
    for (const component of components) {
      for (const [element, instance] of component.instances) {
        if (!document.contains(element) || !element.matches(component.selector)) {
          unmount(component, element, instance);
        }
      }
    }
  }

  async function mount(component: Component, element: Element, instance: Instance): Promise<void> {
    try {
      component.module ??= Promise.resolve()
        .then(component.load)
        .catch((error: unknown) => {
          component.module = undefined;
          console.error(`[Labus] Błąd ładowania komponentu ${component.name}.`, error);
          return undefined;
        });

      const module = await component.module;

      if (instance.controller.signal.aborted) {
        return;
      }

      if (!module || !document.contains(element) || !element.matches(component.selector)) {
        unmount(component, element, instance);
        return;
      }

      instance.cleanup = module.mount(element, instance.controller.signal);
    } catch (error) {
      unmount(component, element, instance);
      console.error(`[Labus] Błąd inicjalizacji komponentu ${component.name}.`, error);
    }
  }

  const removals = new MutationObserver((records) => {
    if (records.some((record) => record.removedNodes.length > 0)) {
      prune();
    }
  });
  removals.observe(document, { childList: true, subtree: true });

  function scan(): void {
    prune();

    for (const component of components) {
      let elements: NodeListOf<Element>;

      try {
        elements = document.querySelectorAll(component.selector);
      } catch (error) {
        console.error(`[Labus] Nieprawidłowy selektor komponentu ${component.name}.`, error);
        continue;
      }

      for (const element of elements) {
        if (component.instances.has(element)) {
          continue;
        }

        // Zarezerwuj instancję przed importem, również przy nakładających się skanach.
        const instance = { controller: new AbortController() };
        component.instances.set(element, instance);
        void mount(component, element, instance);
      }
    }
  }

  function dispose(): void {
    removals.disconnect();

    for (const component of components) {
      for (const [element, instance] of component.instances) {
        unmount(component, element, instance);
      }
    }
  }

  return { scan, dispose };
}
