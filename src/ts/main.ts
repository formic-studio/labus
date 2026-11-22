import '../css/main.css';
import { onBricksNodesAdded } from './core/bricks-events';
import { createComponentRegistry, type ComponentDefinition } from './core/component-registry';

const components = [
  {
    name: 'example-disclosure',
    selector: '[data-component="example-disclosure"]',
    load: () => import('./components/example-disclosure'),
  },
] satisfies readonly ComponentDefinition[];

function start(): void {
  const lifecycle = new AbortController();
  const registry = createComponentRegistry(document, components);

  onBricksNodesAdded(document, registry.scan, lifecycle.signal);
  window.addEventListener(
    'pagehide',
    (event) => {
      // Zachowaj działające komponenty, jeśli przeglądarka przechowuje całą stronę w bfcache.
      if (!event.persisted) {
        lifecycle.abort();
        registry.dispose();
      }
    },
    { signal: lifecycle.signal },
  );

  registry.scan();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
