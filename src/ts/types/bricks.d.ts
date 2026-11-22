export {};

declare global {
  interface DocumentEventMap {
    'bricks/ajax/nodes_added': CustomEvent<{ queryId: string }>;
  }
}
