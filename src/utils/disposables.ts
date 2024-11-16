import { Disposable } from 'quickjs-emscripten';

type WithDispose = Omit<Disposable, 'alive'>;

export type DisposablesList = WithDispose & {
  push: (name: string, disposable: Disposable | DisposablesList) => void;
};

const DEBUG = false;

interface NamedDisposable {
  name: string;
  disposable: WithDispose;
  alive: boolean;
}

export function createDisposables(): DisposablesList {
  const items: NamedDisposable[] = [];

  const dispose = () => {
    for (const namedDisposable of items.reverse()) {
      if (!namedDisposable.alive) return;
      namedDisposable.alive = false;

      if (DEBUG) {
        console.log(`[Disposing] ${namedDisposable.name}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (namedDisposable.disposable as any).dispose();
    }
  };

  return {
    push: (name: string, disposable: WithDispose) => {
      if (DEBUG) {
        console.log(`[New disposable] ${name}`);
      }
      items.push({ name, disposable, alive: true });
    },
    [Symbol.dispose]: dispose,
    dispose: dispose,
  };
}
