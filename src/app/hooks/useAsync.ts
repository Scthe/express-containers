import { useCallback, useState } from 'react';

export type AsyncState<T> =
  | { type: 'done'; value: T }
  | { type: 'loading' }
  | { type: 'error'; error: unknown }
  | { type: 'initial' };

export default function useAsync<T>(callback: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({ type: 'initial' });

  const execute = useCallback(async () => {
    setState({ type: 'loading' });

    try {
      const value = await callback();
      setState({ type: 'done', value });
    } catch (error) {
      setState({ type: 'error', error });
    }
  }, [callback]);

  return { state, execute };
}
