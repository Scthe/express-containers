import { QuickJsVm } from 'app/quick-js';
import { useCallback, useState } from 'react';
import { VirtualFS } from 'virtual-fs';
import { RuninngServerState, useStartServer, useStopServer } from './utils';
import { sendFakeRequest } from 'app/utils/sendFakeRequest';
import { toast } from 'react-toastify';
import { quickJSContext_getExtras } from 'app/quick-js/context';

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
    await stopServerImpl(serverState);
    if (state !== 'stopped') return;

    // eslint-disable-next-line no-console
    console.log(`Starting Express server..`);
    setState('starting-up');
    try {
      const newServerState = await startServerImpl();

      setServerState(newServerState);
      setState('running');

      const port = getExpressPort(newServerState);
      toast.success(`Express is running on port ${port}.`);
    } catch (e) {
      setState('stopped');
      stopServerImpl(serverState);
      toast.error(`Could not start Express. Check logs.`);
      throw e;
    }
  }, [serverState, startServerImpl, state, stopServerImpl]);

  const stopServer = useCallback(async () => {
    if (state !== 'running') return;

    // eslint-disable-next-line no-console
    console.log(`Shutting down the Express server..`);
    setState('shutting-down');

    try {
      await stopServerImpl(serverState);
      setState('stopped');
      toast.success(`The Express is down`);
    } catch (e) {
      setState('running');
      toast.error(`Could not stop Express. Check logs.`);
      throw e;
    }
  }, [serverState, state, stopServerImpl]);

  const sendFakeRequestCb = useCallback(
    async (pathname: string) => {
      if (!serverState) {
        console.error(`Tried to send server request but no server is running?`);
        return;
      }
      return sendFakeRequest(serverState.context, pathname);
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
