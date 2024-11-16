import React, { useCallback } from 'react';
import { Button } from './button';
import LoaderOverlayContent from './loaders';
import {
  ContainerState,
  InterceptedFetchResponse,
} from 'app/model/useContainerState';
import useAsync, { AsyncState } from 'app/hooks/useAsync';
import { stringify } from 'utils';

interface OutputPanelProps {
  containerState: ContainerState;
}

export function OutputPanel({ containerState }: OutputPanelProps) {
  const { state } = containerState;

  if (state == 'stopped' || state == 'starting-up') {
    return <ScreenWhenStopped containerState={containerState} />;
  }

  return <ScreenWhenRunning containerState={containerState} />;
}

function ScreenWhenStopped(p: OutputPanelProps) {
  // TODO adjustable port?
  // TODO adjustable path?
  const { state, startServer } = p.containerState;

  return (
    <div className="relative flex flex-col items-center justify-center h-full">
      <LoaderOverlayContent visible={state === 'starting-up'} />
      <Button disabled={state === 'starting-up'} onClick={startServer}>
        Start the server
      </Button>
    </div>
  );
}

function ScreenWhenRunning(p: OutputPanelProps) {
  const { state, stopServer, sendFakeRequest } = p.containerState;

  const fetchState = useAsync(useCallback(sendFakeRequest, [sendFakeRequest]));

  return (
    <div className="relative max-h-full min-h-full overflow-y-auto">
      <LoaderOverlayContent visible={state === 'shutting-down'} />

      {/* Cannot make sticky cause panel resize goes wonky */}
      <div className="top-0 py-2 mb-4 text-center">
        <Button
          danger
          disabled={state === 'shutting-down'}
          onClick={stopServer}
        >
          Stop the server
        </Button>
      </div>

      <div className="px-2 mb-4">
        <h3 className="mb-2 text-2xl">Fetch</h3>

        <div className="pl-5">
          <Button small className="mb-3" onClick={fetchState.execute}>
            Fetch from the server
          </Button>

          {fetchState.state.type !== 'initial' ? (
            <FakeFetchResponse {...fetchState} />
          ) : null}
        </div>
      </div>

      {/*  TODO implement iframe 
      <div>
        <h3>Iframe</h3>
      </div>
        */}
    </div>
  );
}

function FakeFetchResponse({
  state,
}: {
  state: AsyncState<InterceptedFetchResponse>;
}) {
  if (state.type === 'initial') return;

  if (state.type === 'loading') {
    return (
      <div className="w-full h-[100px] relative">
        <LoaderOverlayContent visible={true} />
      </div>
    );
  }

  if (state.type === 'error') {
    return (
      <div className="">
        <h3 className="mb-1 text-lg">ERROR</h3>
        <pre className="ml-5 bg-red-800 text-slate-200">
          {JSON.stringify(state.error)}
        </pre>
      </div>
    );
  }

  const resp = state.value;

  return (
    <div className="">
      <h3 className="mb-1 text-lg">Response</h3>

      <div className="ml-5">
        <KeyValue label="Status code" value={resp.statusCode} />

        {Object.keys(resp.headers).map((header) => (
          <KeyValue
            key={header}
            label={`Headers[${header}]`}
            value={resp.headers[header]}
          />
        ))}

        <pre className="p-1 mt-1 rounded bg-slate-300 text-slate-900">
          {stringify(resp.data)}
        </pre>
      </div>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: unknown }) {
  return (
    <p>
      <span className="text-accent-300">{label}:&nbsp;</span>
      {stringify(value)}
    </p>
  );
}
