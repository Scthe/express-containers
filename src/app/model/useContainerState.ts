import { useCallback, useState } from 'react';
import { delay } from 'utils';

export type ContainerStateEnum =
  | 'running'
  | 'stopped'
  | 'starting-up'
  | 'shutting-down';

export type ContainerState = ReturnType<typeof useContainerState>;

export type InterceptedFetchResponse = {
  statusCode: number;
  headers: Record<string, string>;
  data: unknown;
};

export function useContainerState() {
  const [state, setState] = useState<ContainerStateEnum>('running'); // TODO revert to 'stopped'

  const startServer = useCallback(async () => {
    if (state !== 'stopped') return;

    setState('starting-up');
    try {
      await delay(); // await startServer();
      setState('running');
    } catch (e) {
      setState('stopped');
      throw e;
    }
  }, [state]);

  const stopServer = useCallback(async () => {
    if (state !== 'running') return;

    setState('shutting-down');
    try {
      await delay(); //await stopServer();
      setState('stopped');
    } catch (e) {
      setState('running');
      throw e;
    }
  }, [state]);

  const sendFakeRequest = useCallback(async () => {
    await delay();
    return {
      statusCode: 404,
      headers: { header0: 'aaaaa' },
      data: 'Hello world!',
    } satisfies InterceptedFetchResponse;
  }, []);

  return {
    state,
    startServer,
    stopServer,
    sendFakeRequest,
  };
}
