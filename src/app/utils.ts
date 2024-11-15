import { createVirtualFileSystem, writeStaticFile } from 'virtual-fs/loaders';
import { vfsDebugTree } from 'virtual-fs';
import { QuickJSContext } from 'quickjs-emscripten';
import {
  quickJSContext_getExtras,
  MONKEY_PATCH_SCRIPT_FILE,
} from './quick-js/context';

export async function initFileSystemForCodeExec() {
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

export function sendFakeRequest(context: QuickJSContext, port: number) {
  // TODO service worker to intercept?
  const { requestInterceptor } = quickJSContext_getExtras(context);

  const interceptOk = requestInterceptor.tryIntercept(port);
  if (!interceptOk) {
    console.error(`Not intercepted port ${port}, would have send real request`);
  }
}
