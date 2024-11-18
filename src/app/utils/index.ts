import { createVirtualFileSystem, writeStaticFile } from 'virtual-fs/loaders';
import { getFileContent, vfsDebugTree, VirtualFS, writeFile } from 'virtual-fs';
import { MONKEY_PATCH_SCRIPT_FILE } from '../quick-js/context';

export async function initFileSystemForCodeExec(originalVfs?: VirtualFS) {
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

  copyPublicFiles(originalVfs, vfs);

  vfsDebugTree(vfs);
  return vfs;
}

const PUBLIC_DIR = 'public';

function copyPublicFiles(
  originalVfs: VirtualFS | undefined,
  targetVfs: VirtualFS
) {
  if (!originalVfs) return;

  const publicDir = originalVfs.files[PUBLIC_DIR];
  if (!publicDir || publicDir.type !== 'directory') return;

  // TODO make this a deep copy
  Object.keys(publicDir.files).forEach((fileName) => {
    const path = `${PUBLIC_DIR}/${fileName}`;
    const readStatus = getFileContent(originalVfs, path);
    if (readStatus.status === 'ok') {
      writeFile(targetVfs, path, readStatus.content);
    }
  });
}
