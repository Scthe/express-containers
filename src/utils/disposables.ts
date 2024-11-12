import { Disposable } from 'quickjs-emscripten';

export type Disposables = ReturnType<typeof createDisposables>;

const DEBUG = false;

interface NamedDisposable {
  name: string;
  disposable: Disposable;
  alive: boolean;
}

export function createDisposables() {
  const items: NamedDisposable[] = [];

  const dispose = () => {
    for (const namedDisposable of items.reverse()) {
      if (!namedDisposable.alive) return;
      namedDisposable.alive = false;

      if (DEBUG) console.log(`[Disposing] ${namedDisposable.name}`);
      (namedDisposable.disposable as any).dispose();
    }
  };

  return {
    push: (name: string, disposable: Disposable) => {
      if (DEBUG) console.log(`[New disposable] ${name}`);
      items.push({ name, disposable, alive: true });
    },
    [Symbol.dispose]: dispose,
    dispose: dispose,
  };
}
