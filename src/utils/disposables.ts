import { Disposable } from 'quickjs-emscripten';

/** like original 'Disposable', but '.alive' is optional */
type WithDispose = Omit<Disposable, 'alive'> &
  Partial<Pick<Disposable, 'alive'>>;

export type DisposablesList = WithDispose & {
  push: (name: string, disposable: Disposable | DisposablesList) => void;
};

const DEBUG = true;

interface NamedDisposable {
  name: string;
  disposable: WithDispose;
  alive: boolean;
}

export function createDisposables(): DisposablesList {
  const items: NamedDisposable[] = [];

  const dispose = () => {
    for (const namedDisposable of items.reverse()) {
      if (!namedDisposable.alive || !namedDisposable.disposable.alive) {
        namedDisposable.alive = false;
        return;
      }
      namedDisposable.alive = false;

      logDisposable(`[Disposing] ${namedDisposable.name}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (namedDisposable.disposable as any).dispose();
    }
  };

  return {
    push: (name: string, disposable: WithDispose) => {
      logDisposable(`[New disposable] ${name}`);
      items.push({ name, disposable, alive: true });
    },
    [Symbol.dispose]: dispose,
    dispose: dispose,
  };
}

function logDisposable(...args: unknown[]) {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}
