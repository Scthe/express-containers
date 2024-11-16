import React, { useCallback, useEffect, useState } from 'react';
import { VirtualFS } from 'virtual-fs';
import { TreeFileList } from './components/treeFileList';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TextEditor } from './components/textEditor';
import { LogsPanel } from './components/logsPanel';
import { OutputPanel } from './components/outputPanel';
import { useContainerState } from './model/useContainerState';
import { useSelectedFile } from './model/useSelectedFile';

// TODO help button
// TODO run button
// TODO less awkward title
// TODO files: switch between vfs and the bundle output
// TODO file list - make scrollable
// TODO gh icon
// TODO glue file tree and editor together?
// TODO when creating bundled FS, copy all that is not 'node_modules'. It might contain templates etc.

/** https://github.com/bvaughn/react-resizable-panels */
export function App({ vfs }: { vfs: VirtualFS }) {
  const containerState = useContainerState();
  const [selectedFile, setSelectedFile] = useSelectedFile(vfs, 'index.js');

  return (
    <main className="w-full h-full font-mono min-h-svh">
      <PanelGroup direction="horizontal" className="min-h-svh">
        <Panel
          maxSize={20}
          minSize={10}
          className="flex flex-col min-h-full pb-6 rounded-r-panel bg-panel"
        >
          <h1 className="p-2 text-xl text-center border-b-2 border-white/20">
            Express in browser
          </h1>
          <h2 className="pl-3 mt-2 mb-2 text-xl">Files</h2>
          <div className="h-0 overflow-y-auto grow">
            <TreeFileList vfs={vfs} onFileSelected={setSelectedFile} />
          </div>
        </Panel>

        <MyPanelResizeHandle />

        <Panel className="bg-panel rounded-panel">
          <div className="overflow-y-auto max-h-svh">
            <TextEditor key={selectedFile} vfs={vfs} path={selectedFile} />
          </div>
        </Panel>

        <MyPanelResizeHandle />

        <Panel>
          <PanelGroup direction="vertical">
            <Panel className="bg-panel rounded-bl-panel">
              <OutputPanel containerState={containerState} />
            </Panel>
            <MyPanelResizeHandle vertical />
            <Panel className="p-2 bg-panel rounded-tl-panel">
              <LogsPanel />
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle />
      </PanelGroup>
    </main>
  );
}

const MyPanelResizeHandle = (props: { vertical?: boolean }) => (
  <PanelResizeHandle className={props.vertical ? 'h-2' : 'w-2'} />
);

function useGetStaticFile(path: string) {
  const [text, setText] = useState('');

  const downloadFile = useCallback(async () => {
    console.log(`Downloading '${path}'`);
    const resp = await fetch(path);
    const text = await resp.text();
    setText(text);
  }, [path]);

  useEffect(() => {
    downloadFile();
  }, [downloadFile]);

  return text;
}
