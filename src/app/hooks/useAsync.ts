import { useCallback, useState } from 'react';

export type AsyncState<T> =
  | { type: 'done'; value: T }
  | { type: 'loading' }
  | { type: 'error'; error: unknown }
  | { type: 'initial' };

export default function useAsync<T>(fnAsync: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({ type: 'initial' });

  const execute = useCallback(async () => {
    setState({ type: 'loading' });

    try {
      const value = await fnAsync();
      setState({ type: 'done', value });
    } catch (error) {
      setState({ type: 'error', error });
    }
  }, [fnAsync]);

  return { state, execute };
}
