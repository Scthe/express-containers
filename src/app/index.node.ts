import { QuickJsVm } from './quick-js';
import {
  quickJSContext_Dispose,
  quickJSContext_getExtras,
} from './quick-js/context';
import 'utils/static_files.node';
import { writeStaticFile } from 'virtual-fs';
import { executeScriptFile } from './quick-js/exec_script_file';
import { initFileSystemForCodeExec, sendFakeRequest } from './app';

main();

export async function main() {
  const vfs = await initFileSystemForCodeExec();
  await writeStaticFile(vfs, 'bundled-express.js', 'index.js');

  const quickJsVm = await QuickJsVm.create();
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
