import { loadVirtualFileSystem_zip } from 'virtual-fs/loaders';
import {
  createBundleOutput,
  buildBundle,
  generateCodeString,
} from 'bundler-wasm/bundle';
import { VirtualFS, writeFile } from 'virtual-fs';
import { QuickJsVm } from './quick-js';
import {
  quickJSContext_getExtras,
  quickJSContext_Dispose,
} from './quick-js/context';
import { executeScriptFile } from './quick-js/exec_script_file';
import { initFileSystemForCodeExec, sendFakeRequest } from './app';

const VFS_FILENAME = 'vfs.zip';

globalThis.process = {
  cwd: () => '',
};

// install URL override for rollup wasm file
const ROLLUP_WASM_FILE = 'bindings_wasm_bg.wasm';
const orgURL = URL;
globalThis.URL = function () {
  const args = Array.from(arguments);
  // console.log('URL', arguments);
  if (args[0] === ROLLUP_WASM_FILE) {
    const url = new orgURL('bindings_wasm_bg.wasm', window.location.href);
    // console.log(url);
    // console.log(typeof url.href);
    // return url.href;
    return new Request(url.href);
  }
  return new orgURL(...args);
};

export async function main() {
  // load initial filesystem
  console.log(`Loading virtual file system from '${VFS_FILENAME}'..`);
  const vfs = await loadVirtualFileSystem_zip(VFS_FILENAME);
  // vfsDebugTree(vfs);

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
}

main();

async function bundle(vfs: VirtualFS): Promise<string> {
  console.log('Running rollup to unify the code (handle CommonJS)..');
  const outputFile = 'bundled-express.js'; // not used
  const bundleOutputOpts = createBundleOutput(outputFile);
  const bundle = await buildBundle(vfs, bundleOutputOpts);
  return generateCodeString(bundle, bundleOutputOpts);
}

async function execBundledCode(quickJsVm: QuickJsVm, code: string) {
  const vfs1 = await initFileSystemForCodeExec();
  writeFile(vfs1, 'index.js', code);
  quickJsVm.mountFileSystem(vfs1);
  const context = await quickJsVm.createContext();

  // run the script
  console.log('\n--- Starting the app ---');
  const drainEventLoop = await executeScriptFile(context, vfs1, 'index.js');

  const cleanup = async () => {
    quickJSContext_getExtras(context).eventLoop.sigKill();
    await drainEventLoop();

    // cleanup
    console.log('Script finished. Disposing of the references');
    quickJSContext_Dispose(context);
  };

  return { context, cleanup };
}
