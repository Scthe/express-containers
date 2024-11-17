import { createVirtualFileSystem, writeStaticFile } from 'virtual-fs/loaders';
import { vfsDebugTree } from 'virtual-fs';
import { MONKEY_PATCH_SCRIPT_FILE } from '../quick-js/context';

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
