import React, { useState } from 'react';
import { Button } from './button';
import LoaderOverlayContent from './loaders';
import { ContainerState } from 'app/model/useContainerState';
import { FetchSection } from './outputPanel/fetchSection';
import {
  WORKER_REQUEST_MARKER,
  WORKER_REQUEST_MARKER_VALUE,
} from 'app/model/serviceWorkerShared';
import { ensureSuffix } from 'utils';

// TODO implement iframe
// TODO tabs if iframe is implemented https://github.com/Scthe/ai-prompt-editor/blob/master/src/components/tabs.tsx

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
  const { state, stopServer } = p.containerState;

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

      <IframeTest />

      <FetchSection containerState={p.containerState} />
    </div>
  );
}

// Problem: repository scope of the worker
function IframeTest() {
  const width = 200;
  const height = 200;
  const [showIframe, setShowIframe] = useState(false);

  // const src = `http://localhost:3000/hello`;
  // const src = `http://localhost:8000/hello?${WORKER_REQUEST_MARKER}=${WORKER_REQUEST_MARKER_VALUE}&key=${showIframe}`;
  // const src = `https://example.com/hello?${WORKER_REQUEST_MARKER}=${WORKER_REQUEST_MARKER_VALUE}`;
  let baseUrl = `${location.protocol}//${location.host}${location.pathname}`;
  baseUrl = ensureSuffix(baseUrl, '/');
  const src = `${baseUrl}?${WORKER_REQUEST_MARKER}=${WORKER_REQUEST_MARKER_VALUE}`;

  return (
    <div>
      <Button small onClick={() => setShowIframe((k) => !k)}>
        Toggle iframe
      </Button>

      {showIframe ? (
        <div className="mt-2 overflow-hidden bg-gray-200 rounded-md">
          <iframe
            src={src}
            height={height}
            width={0}
            sandbox="allow-same-origin allow-scripts"
            className="w-full"
          />
        </div>
      ) : null}
    </div>
  );
}
