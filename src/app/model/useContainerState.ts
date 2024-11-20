import { QuickJsVm } from 'app/quick-js';
import { useCallback, useState } from 'react';
import { VirtualFS } from 'virtual-fs';
import { RuninngServerState, useStartServer, useStopServer } from './utils';
import {
  InterceptedFetchResponse,
  sendFakeRequest,
} from 'app/utils/sendFakeRequest';
import { toast } from 'react-toastify';
import { quickJSContext_getExtras } from 'app/quick-js/context';
import { ensurePrefix } from 'utils';
import { SERVICE_WORKER_API } from './serviceWorkerApi';
import {
  WORKER_REQUEST_MARKER,
  WORKER_REQUEST_MARKER_VALUE,
} from './serviceWorkerShared';

export type ContainerStateEnum =
  | 'running'
  | 'stopped'
  | 'starting-up'
  | 'shutting-down';

export type ContainerState = ReturnType<typeof useContainerState>;

export type FakeRequestFn = ContainerState['sendFakeRequest'];

export function useContainerState(quickJsVm: QuickJsVm, vfs: VirtualFS) {
  const [state, setState] = useState<ContainerStateEnum>('stopped');
  const [serverState, setServerState] = useState<
    RuninngServerState | undefined
  >(undefined);

  const startServerImpl = useStartServer(quickJsVm, vfs);
  const stopServerImpl = useStopServer();

  const startServer = useCallback(async () => {
    // await stopServerImpl(serverState); // not needed, can cause dispose() called-twice problems..
    if (state !== 'stopped') return;

    // eslint-disable-next-line no-console
    console.log(`Starting Express server..`);
    setState('starting-up');
    try {
      const newServerState = await startServerImpl();
      SERVICE_WORKER_API.setContext(newServerState.context);

      setServerState(newServerState);
      setState('running');

      const port = getExpressPort(newServerState);
      toast.success(`Express server is running on port ${port}`);
    } catch (e) {
      setState('stopped');
      stopServerImpl(serverState);
      toast.error(`Could not start Express server. Check logs.`);
      throw e;
    }
  }, [serverState, startServerImpl, state, stopServerImpl]);

  const stopServer = useCallback(async () => {
    if (state !== 'running') return;

    // eslint-disable-next-line no-console
    console.log(`Shutting down Express server..`);
    setState('shutting-down');

    try {
      await stopServerImpl(serverState);
      setState('stopped');
      toast.success(`Express server is down`);
    } catch (e) {
      setState('running');
      toast.error(`Could not stop Express server. Check logs.`);
      throw e;
    }
  }, [serverState, state, stopServerImpl]);

  const sendFakeRequestCb = useCallback(
    async (
      pathname: string,
      useServiceWorker = false
    ): Promise<InterceptedFetchResponse | undefined> => {
      if (!serverState) {
        console.error(`Tried to send server request but no server is running?`);
        return;
      }

      // without service worker
      if (!useServiceWorker) {
        return sendFakeRequest(serverState.context, pathname);
      }

      // service worker codeflow is a bit more complex
      const port = getExpressPort(serverState);
      const url = `//localhost:${port}${ensurePrefix(pathname, '/')}`;
      SERVICE_WORKER_API.setContext(serverState.context);

      const resp = await fetch(url, {
        headers: { [WORKER_REQUEST_MARKER]: WORKER_REQUEST_MARKER_VALUE },
      });
      const text = await resp.text();
      // eslint-disable-next-line no-console
      console.log('FETCH_RESP', {
        code: resp.status,
        headers: resp.headers,
        data: text,
      });

      return {
        statusCode: resp.status,
        headers: Object.fromEntries(resp.headers),
        data: text,
        request: {
          pathname,
          port,
        },
      };
    },
    [serverState]
  );

  return {
    state,
    startServer,
    stopServer,
    sendFakeRequest: sendFakeRequestCb,
    bundledVirtualFs: serverState?.bundledVfs,
    expressPort: getExpressPort(serverState),
  };
}

function getExpressPort(s: RuninngServerState | undefined) {
  let port: number | undefined = undefined;
  if (s) {
    port = quickJSContext_getExtras(s.context)?.serverPort;
  }
  return port || 3000;
}
