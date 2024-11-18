/* eslint-disable no-console */
import { QuickJsVm } from 'app/quick-js';
import {
  quickJSContext_getExtras,
  quickJSContext_Dispose,
} from 'app/quick-js/context';
import { executeScriptFile } from 'app/quick-js/exec_script_file';
import { initFileSystemForCodeExec } from 'app/utils';
import {
  createBundleOutput,
  buildBundle,
  generateCodeString,
} from 'bundler-wasm/bundle';
import { QuickJSContext } from 'quickjs-emscripten';
import { useCallback } from 'react';
import { VirtualFS, writeFile } from 'virtual-fs';

export interface RuninngServerState {
  context: QuickJSContext;
  cleanup: () => Promise<void>;
  bundledVfs: VirtualFS;
}

async function bundle(vfs: VirtualFS): Promise<string> {
  console.log('Running rollup to unify the code (handle CommonJS)..');
  const outputFile = 'bundled-express.js'; // not used
  const bundleOutputOpts = createBundleOutput(outputFile);
  const bundle = await buildBundle(vfs, bundleOutputOpts);
  return generateCodeString(bundle, bundleOutputOpts);
}

async function execBundledCode(
  quickJsVm: QuickJsVm,
  originalVfs: VirtualFS,
  code: string
): Promise<RuninngServerState> {
  const vfs = await initFileSystemForCodeExec(originalVfs);
  writeFile(vfs, 'index.js', code);
  quickJsVm.mountFileSystem(vfs);
  const context = await quickJsVm.createContext();

  // run the script
  console.log('\n--- Starting the app ---');
  const drainEventLoop = await executeScriptFile(context, vfs, 'index.js');

  const cleanup = async () => {
    quickJSContext_getExtras(context).eventLoop.sigKill();
    await drainEventLoop();

    // cleanup
    console.log('Script finished. Disposing of the references');
    quickJSContext_Dispose(context);
  };

  return { context, cleanup, bundledVfs: vfs };
}

export const useStartServer = (quickJsVm: QuickJsVm, vfs: VirtualFS) => {
  return useCallback(async () => {
    const code = await bundle(vfs);
    const serverState = await execBundledCode(quickJsVm, vfs, code);
    return serverState;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export const useStopServer = () => {
  return useCallback(async (state: RuninngServerState | undefined) => {
    if (state) {
      await state.cleanup();
    }
  }, []);
};
