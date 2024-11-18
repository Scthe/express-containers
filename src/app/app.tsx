import React from 'react';
import { VirtualFS } from 'virtual-fs';
import { TreeFileList } from './components/treeFileList';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TextEditor } from './components/textEditor';
import { LogsPanel } from './components/logsPanel';
import { OutputPanel } from './components/outputPanel';
import { useContainerState } from './model/useContainerState';
import { useSelectedFile } from './model/useSelectedFile';
import classNames from 'classnames';
import {
  HeaderFiles,
  HeaderOutput,
  HeaderTextEditor,
} from './components/header';
import { useShownFileSystem } from './model/useShownFileSystem';
import { QuickJsVm } from './quick-js';
import { GitHubBtn } from './components/githubButton';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

// TODO turn service worker on/off for fetch
// TODO static files in the browser
// TODO when creating bundled FS, copy all that is not 'node_modules'. It might contain view templates etc.

interface Props {
  vfs: VirtualFS;
  quickJsVm: QuickJsVm;
}

/** https://github.com/bvaughn/react-resizable-panels */
export function App({ vfs, quickJsVm }: Props) {
  const containerState = useContainerState(quickJsVm, vfs);

  const shownFileSystem = useShownFileSystem(
    vfs,
    containerState.bundledVirtualFs
  );

  const [selectedFile, setSelectedFile] = useSelectedFile(
    shownFileSystem.fileSystem,
    'index.js'
  );

  return (
    <main className="w-full h-full font-mono min-h-svh">
      <PanelGroup direction="horizontal" className="p-2 min-h-svh">
        <Panel maxSize={20} minSize={10} className="flex flex-col min-h-full ">
          <div className="z-10 px-4 py-2 mb-2 mr-2 bg-panel rounded-panel">
            <div className="flex justify-between">
              <h1 className="mr-2 text-xl text-center">Express containers</h1>
              <GitHubBtn />
            </div>
          </div>

          <div className="relative flex flex-col bg-panel panel-activable grow rounded-l-panel">
            {/* smooth top-right corner */}
            <div
              className={classNames(
                'absolute top-[-18px] right-[-2px] w-[16px] h-[16px] bg-panel',
                'before:absolute before:top-0 before:right-0 before:w-full before:h-full before:bg-page before:rounded-br-panel'
              )}
            ></div>

            <HeaderFiles
              hasBundleFileSystem={shownFileSystem.hasBundleFileSystem}
              shownFileSystem={shownFileSystem.shownFileSystem}
              onFileSystemChange={shownFileSystem.setShownFileSystem}
            />

            <div className="h-0 pb-6 overflow-y-auto grow">
              <TreeFileList
                key={shownFileSystem.shownFileSystem}
                vfs={shownFileSystem.fileSystem}
                onFileSelected={setSelectedFile}
                selectedFile={selectedFile}
              />
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="" />

        <Panel className="bg-panel rounded-t-panel rounded-br-panel panel-activable ">
          <div className="flex flex-col h-full max-h-svh">
            <HeaderTextEditor filepath={selectedFile} />
            <div className="h-0 overflow-y-auto grow">
              <TextEditor
                key={selectedFile}
                vfs={shownFileSystem.fileSystem}
                path={selectedFile}
              />
            </div>
          </div>
        </Panel>

        <MyPanelResizeHandle />

        <Panel>
          <PanelGroup direction="vertical">
            <Panel className="flex flex-col bg-panel rounded-panel panel-activable">
              <HeaderOutput />
              <OutputPanel containerState={containerState} />
            </Panel>

            <MyPanelResizeHandle vertical />

            <Panel className="flex flex-col bg-panel rounded-panel panel-activable">
              <LogsPanel />
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle />
      </PanelGroup>

      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        limit={1}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        theme="light"
      />
    </main>
  );
}

const MyPanelResizeHandle = (props: { vertical?: boolean }) => (
  <PanelResizeHandle className={props.vertical ? 'h-2' : 'w-2'} />
);
