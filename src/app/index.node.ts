import { createQuickJsVm } from './quick-js';
import {
  MONKEY_PATCH_SCRIPT_FILE,
  quickJSContext_Dispose,
} from './quick-js/context';
import 'utils/static_files.node';
import {
  createVirtualFileSystem,
  writeStaticFile,
  vfsDebugTree,
} from 'virtual-fs';
import { executeScriptFile } from './quick-js/exec_script_file';

main();

export async function main() {
  const vfs = await initFileSystem();

  const quickJsVm = await createQuickJsVm();
  quickJsVm.mountFileSystem(vfs);
  const context = await quickJsVm.createContext();

  // run the script
  console.log('\n--- Starting the app ---');
  await executeScriptFile(context, vfs, 'index.js');

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
  await copyStdLibStatic('buffer.js');

  vfsDebugTree(vfs);
  return vfs;
}
