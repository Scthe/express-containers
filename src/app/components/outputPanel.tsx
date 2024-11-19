import React, { useState } from 'react';
import { Button } from './button';
import LoaderOverlayContent from './loaders';
import { ContainerState } from 'app/model/useContainerState';
import { FetchSection } from './outputPanel/fetchSection';
import { TabDef, Tabs } from './tabs';
import { IframeSection } from './outputPanel/iframeSection';
import { HeaderOutput } from './header';

type TabId = 'fetch' | 'iframe';

const TABS: TabDef<TabId>[] = [
  { id: 'fetch', label: 'Fetch' },
  { id: 'iframe', label: 'Iframe' },
];

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
    <>
      <HeaderOutput />
      <div className="relative flex flex-col items-center justify-center grow">
        <LoaderOverlayContent visible={state === 'starting-up'} />
        <Button disabled={state === 'starting-up'} onClick={startServer}>
          Start the server
        </Button>
      </div>
    </>
  );
}

function ScreenWhenRunning(p: OutputPanelProps) {
  const { state, stopServer } = p.containerState;
  const [activeTab, setActiveTab] = useState<TabId>('fetch');

  return (
    <>
      <HeaderOutput
        stopServerDisabled={state === 'shutting-down'}
        onStopTheServer={stopServer}
      />
      <div className="relative h-0 overflow-y-auto grow">
        <LoaderOverlayContent visible={state === 'shutting-down'} />

        <Tabs
          id="server-text-mode"
          activeTab={activeTab}
          tabs={TABS}
          onTabSwitch={setActiveTab}
          className="mb-4"
        />

        {activeTab === 'fetch' ? (
          <FetchSection containerState={p.containerState} />
        ) : (
          <IframeSection />
        )}
      </div>
    </>
  );
}
