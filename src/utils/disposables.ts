export type Disposables = ReturnType<typeof createDisposables>;

export function createDisposables() {
  let wasDisposed = false;
  const items: Disposable[] = [];

  const dispose = () => {
    if (wasDisposed) return;
    wasDisposed = true;

    for (const disposable of items.reverse()) {
      (disposable as any).dispose();
    }
  };

  return {
    push: (d: Disposable) => items.push(d),
    [Symbol.dispose]: dispose,
    dispose: dispose,
  };
}
