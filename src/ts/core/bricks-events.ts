export function onBricksNodesAdded(
  document: Document,
  listener: (event: DocumentEventMap['bricks/ajax/nodes_added']) => void,
  signal: AbortSignal,
): void {
  document.addEventListener('bricks/ajax/nodes_added', listener, { signal });
}
