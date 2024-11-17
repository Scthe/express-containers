import React from 'react';
import ReactDOM from 'react-dom/client';
import { loadVirtualFileSystem_zip } from 'virtual-fs/loaders';
import { QuickJsVm } from './quick-js';
import { isProductionBuild } from 'utils';
import { App } from './app';
import './index.css';
import './web/hacks';

const VFS_FILENAME = 'vfs.zip';

(function () {
  if (!isProductionBuild()) {
    // eslint-disable-next-line no-console
    console.log('Starting esbuild live reload');
    new EventSource('/esbuild').addEventListener('change', () =>
      location.reload()
    );
  }
})();

export async function main() {
  // load initial filesystem
  console.log(`Loading virtual file system from '${VFS_FILENAME}'..`);
  const vfs = await loadVirtualFileSystem_zip(VFS_FILENAME);
  // vfsDebugTree(vfs);

  // init vm
  const quickJsVm = await QuickJsVm.create();

  // render UI
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <App vfs={vfs} quickJsVm={quickJsVm} />
    </React.StrictMode>
  );

  /*
   // init vm
  const quickJsVm = await QuickJsVm.create();

  ////////////////////////////////////////////
  const code = await bundle(vfs);
  const runningServerVmContext = await execBundledCode(quickJsVm, code);

  sendFakeRequest(runningServerVmContext.context, 3000);

  await runningServerVmContext.cleanup();
  ////////////////////////////////////////////

  quickJsVm.shutdown();
  console.log('--- DONE ---');
  */
}

main();
