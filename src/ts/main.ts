import '../css/main.css';
import { onBricksNodesAdded } from './core/bricks-events';
import { createComponentRegistry, type ComponentDefinition } from './core/component-registry';

const components = [
  {
    name: 'smooth-scroll',
    selector: '#brx-content',
    load: () => import('./components/smooth-scroll'),
  },
  {
    name: 'intro',
    selector: '[data-component="intro"]',
    load: () => import('./components/intro'),
  },
  {
    name: 'logo-marquee',
    selector: '[data-component="logo-marquee"]',
    load: () => import('./components/logo-marquee'),
  },
  {
    name: 'design-approach',
    selector: '[data-component="design-approach"]',
    load: () => import('./components/design-approach'),
  },
  {
    name: 'directional-fill',
    selector: '[data-component="directional-fill"]',
    load: () => import('./components/directional-fill'),
  },
  {
    name: 'site-header',
    selector: '[data-component="site-header"]',
    load: () => import('./components/site-header'),
  },
  {
    name: 'site-footer',
    selector: '[data-component="site-footer"]',
    load: () => import('./components/site-footer'),
  },
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
