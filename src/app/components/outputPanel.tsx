import React from 'react';
import { Button } from './button';
import LoaderOverlayContent from './loaders';
import { ContainerState } from 'app/model/useContainerState';
import { FetchSection } from './outputPanel/fetchSection';

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

      <FetchSection containerState={p.containerState} />
    </div>
  );
}
