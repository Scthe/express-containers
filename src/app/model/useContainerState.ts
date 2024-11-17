import { QuickJsVm } from 'app/quick-js';
import { useCallback, useState } from 'react';
import { VirtualFS } from 'virtual-fs';
import { RuninngServerState, useStartServer, useStopServer } from './utils';
import { sendFakeRequest } from 'app/utils/sendFakeRequest';

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
    stopServerImpl(serverState);
    if (state !== 'stopped') return;

    setState('starting-up');
    try {
      // await delay(); // await startServer();
      const newServerState = await startServerImpl();
      setServerState(newServerState);
      setState('running');
    } catch (e) {
      setState('stopped');
      stopServerImpl(serverState);
      throw e;
    }
  }, [serverState, startServerImpl, state, stopServerImpl]);

  const stopServer = useCallback(async () => {
    if (state !== 'running') return;

    setState('shutting-down');
    try {
      // await delay(); //await stopServer();
      await stopServerImpl(serverState);
      setState('stopped');
    } catch (e) {
      setState('running');
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
  };
}
