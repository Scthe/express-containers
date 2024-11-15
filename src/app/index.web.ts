import {
  createVirtualFileSystem,
  loadVirtualFileSystem_zip,
  writeStaticFile,
} from 'virtual-fs/loaders';
import {
  createBundleOutput,
  buildBundle,
  generateCodeString,
} from 'bundler-wasm/bundle';
import { vfsDebugTree, writeFile } from 'virtual-fs';
import { QuickJSContext } from 'quickjs-emscripten';
import { createQuickJsVm } from './quick-js';
import {
  quickJSContext_getExtras,
  quickJSContext_Dispose,
  MONKEY_PATCH_SCRIPT_FILE,
} from './quick-js/context';
import { executeScriptFile } from './quick-js/exec_script_file';

const VFS_FILENAME = 'vfs.zip';
const OUTPUT_PATH = 'static/bundled-express.js';

globalThis.process = {
  cwd: () => '',
};

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

export async function main(outputFile: string) {
  console.log(`Loading virtual file system from '${VFS_FILENAME}'..`);
  const vfs0 = await loadVirtualFileSystem_zip(VFS_FILENAME);
  // vfsDebugTree(vfs);

  console.log('Running rollup to unify the code (handle CommonJS)..');
  const bundleOutputOpts = createBundleOutput(outputFile);
  const bundle = await buildBundle(vfs0, bundleOutputOpts);
  const code = await generateCodeString(bundle, bundleOutputOpts);

  ////////////////////////////////////////////
  const vfs1 = await initFileSystem();
  writeFile(vfs1, 'index.js', code);

  const quickJsVm = await createQuickJsVm();
  quickJsVm.mountFileSystem(vfs1);
  const context = await quickJsVm.createContext();

  // run the script
  console.log('\n--- Starting the app ---');
  const drainEventLoop = await executeScriptFile(context, vfs1, 'index.js');

  sendFakeRequest(context, 3000);

  quickJSContext_getExtras(context).eventLoop.sigKill();
  await drainEventLoop();

  // cleanup
  console.log('Script finished. Disposing of the references');
  quickJSContext_Dispose(context);
  quickJsVm.shutdown();
  console.log('--- DONE ---');
}

main(OUTPUT_PATH);

// TODO duplicated from node
async function initFileSystem() {
  const vfs = createVirtualFileSystem();

  const copyStdLibStatic = (path: string, virtualPath?: string) => {
    return writeStaticFile(
      vfs,
      `node-std-lib-static/${path}`,
      virtualPath || path
    );
  };

  await copyStdLibStatic('_monkey_patch.js', MONKEY_PATCH_SCRIPT_FILE);
  await copyStdLibStatic('fs.js');
  await copyStdLibStatic('net.js');

  vfsDebugTree(vfs);
  return vfs;
}

function sendFakeRequest(context: QuickJSContext, port: number) {
  // TODO service worker to intercept?
  const { eventLoop, requestInterceptor } = quickJSContext_getExtras(context);

  const interceptOk = requestInterceptor.tryIntercept(port);
  if (!interceptOk) {
    console.error(`Not intercepted port ${port}, would have send real request`);
  }
}
