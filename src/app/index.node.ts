/* eslint-disable no-console */
import { QuickJsVm } from './quick-js';
import {
  quickJSContext_Dispose,
  quickJSContext_getExtras,
} from './quick-js/context';
import 'utils/static_files.node';
import { loadVirtualFileSystem_zip, writeStaticFile } from 'virtual-fs';
import { executeScriptFile } from './quick-js/exec_script_file';
import { initFileSystemForCodeExec } from './utils';
import { sendFakeRequest } from './utils/sendFakeRequest';

export const VFS_FILENAME = 'vfs.zip';
const REQUEST_PATHNAME = 'hello?param0=1&param2';
// const REQUEST_PATHNAME = '';
// const REQUEST_PATHNAME = 'user/my-user-id';
// const REQUEST_PATHNAME = 'error-500';
// const REQUEST_PATHNAME = 'gimme-404';

main(REQUEST_PATHNAME);

export async function main(pathname: string) {
  const originalVfs = await loadVirtualFileSystem_zip(VFS_FILENAME);
  const vfs = await initFileSystemForCodeExec(originalVfs);
  await writeStaticFile(vfs, 'bundled-express.js', 'index.js');

  const quickJsVm = await QuickJsVm.create();
  quickJsVm.mountFileSystem(vfs);
  const context = await quickJsVm.createContext();

  // run the script
  console.log('\n--- Starting the app ---');
  const drainEventLoop = await executeScriptFile(context, vfs, 'index.js');

  sendFakeRequest(context, pathname);

  quickJSContext_getExtras(context).eventLoop.sigKill();
  await drainEventLoop();

  // cleanup
  console.log('Script finished. Disposing of the references');
  quickJSContext_Dispose(context);
  quickJsVm.shutdown();
  console.log('--- DONE ---');
}
