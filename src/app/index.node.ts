import { createQuickJsVm } from './quick-js';
import {
  MONKEY_PATCH_SCRIPT_FILE,
  quickJSContext_Dispose,
  quickJSContext_getExtras,
} from './quick-js/context';
import 'utils/static_files.node';
import {
  createVirtualFileSystem,
  writeStaticFile,
  vfsDebugTree,
} from 'virtual-fs';
import { executeScriptFile } from './quick-js/exec_script_file';
import { QuickJSContext } from 'quickjs-emscripten';

main();

export async function main() {
  const vfs = await initFileSystem();

  const quickJsVm = await createQuickJsVm();
  quickJsVm.mountFileSystem(vfs);
  const context = await quickJsVm.createContext();

  // run the script
  console.log('\n--- Starting the app ---');
  const drainEventLoop = await executeScriptFile(context, vfs, 'index.js');

  sendFakeRequest(context, 3000);

  quickJSContext_getExtras(context).eventLoop.sigKill();
  await drainEventLoop();

  // cleanup
  console.log('Script finished. Disposing of the references');
  quickJSContext_Dispose(context);
  quickJsVm.shutdown();
  console.log('--- DONE ---');
}

async function initFileSystem() {
  const vfs = createVirtualFileSystem();

  const copyStdLibStatic = (path: string, virtualPath?: string) => {
    return writeStaticFile(
      vfs,
      `node-std-lib-static/${path}`,
      virtualPath || path
    );
  };

  await writeStaticFile(vfs, 'bundled-express.js', 'index.js');
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
