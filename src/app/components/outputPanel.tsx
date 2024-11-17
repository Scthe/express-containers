import React, { useCallback } from 'react';
import { Button } from './button';
import LoaderOverlayContent from './loaders';
import { ContainerState, FakeRequestFn } from 'app/model/useContainerState';
import useAsync, { AsyncState } from 'app/hooks/useAsync';
import { stringify } from 'utils';
import { InterceptedFetchResponse } from 'app/utils/sendFakeRequest';

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
  // TODO 404
  // TODO 500 - endpoint that throws
  const { state, startServer } = p.containerState;

  return (
    <div className="relative flex flex-col items-center justify-center grow">
      <LoaderOverlayContent visible={state === 'starting-up'} />
      <Button disabled={state === 'starting-up'} onClick={startServer}>
        Start the server
      </Button>
    </div>
  );
}

function ScreenWhenRunning(p: OutputPanelProps) {
  const { state, stopServer, sendFakeRequest } = p.containerState;

  return (
    <div className="relative h-0 overflow-y-auto grow">
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

      {/* TODO tabs */}
      <FetchSection
        title="Fetch"
        buttonText="Fetch from the server"
        pathname="hello?param0=1&param2"
        sendFakeRequest={sendFakeRequest}
      />

      <FetchSection
        title="Fetch with :userId"
        buttonText="Fetch with param"
        pathname="user/my-user-id"
        sendFakeRequest={sendFakeRequest}
      />

      <FetchSection
        title="Fetch 404"
        buttonText="Fetch nonexisting endpoint"
        pathname="endpoint-404"
        sendFakeRequest={sendFakeRequest}
      />

      <FetchSection
        title="Fetch 500"
        buttonText="Fetch with internal error"
        pathname="error-500"
        sendFakeRequest={sendFakeRequest}
      />

      {/*  TODO implement iframe 
      <div>
        <h3>Iframe</h3>
      </div>
        */}
    </div>
  );
}

function FetchSection(props: {
  title: string;
  buttonText: string;
  pathname: string;
  sendFakeRequest: FakeRequestFn;
}) {
  const { sendFakeRequest, pathname } = props;
  const sendReq = useCallback(
    () => sendFakeRequest(pathname),
    [pathname, sendFakeRequest]
  );
  const fetchState = useAsync(sendReq);

  return (
    <div className="px-2 mb-4">
      <h3 className="mb-2 text-lg">{props.title}</h3>

      <div className="pl-5">
        <Button small className="mb-3" onClick={fetchState.execute}>
          {props.buttonText}
        </Button>

        {fetchState.state.type !== 'initial' ? (
          <FakeFetchResponse {...fetchState} />
        ) : null}
      </div>
    </div>
  );
}

function FakeFetchResponse({
  state,
}: {
  state: AsyncState<InterceptedFetchResponse | undefined>;
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
  if (!resp) {
    return (
      <div className="">
        <h3 className="mb-1 text-lg">ERROR</h3>
        <pre className="ml-5 bg-red-800 text-slate-200">(undefined?)</pre>
      </div>
    );
  }

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
