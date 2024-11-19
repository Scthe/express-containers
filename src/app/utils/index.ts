import { createVirtualFileSystem } from 'virtual-fs/loaders';
import { getFileContent, vfsDebugTree, VirtualFS, writeFile } from 'virtual-fs';
import { MONKEY_PATCH_SCRIPT_FILE } from '../quick-js/context';
import { NODE_STD_LIB } from 'bundler-wasm/vfs-plugin';

export async function initFileSystemForCodeExec(originalVfs: VirtualFS) {
  const vfs = createVirtualFileSystem();

  copyFile(
    originalVfs,
    `${NODE_STD_LIB}/${MONKEY_PATCH_SCRIPT_FILE}`,
    vfs,
    MONKEY_PATCH_SCRIPT_FILE
  );
  copyFile(originalVfs, `${NODE_STD_LIB}/fs.js`, vfs, 'fs.js');
  copyFile(originalVfs, `${NODE_STD_LIB}/net.js`, vfs, 'net.js');

  copyPublicFiles(originalVfs, vfs);

  vfsDebugTree(vfs);
  return vfs;
}

const PUBLIC_DIR = 'public';

function copyPublicFiles(originalVfs: VirtualFS, targetVfs: VirtualFS) {
  const publicDir = originalVfs.files[PUBLIC_DIR];
  if (!publicDir || publicDir.type !== 'directory') return;

  // TODO [LOW] make this a deep copy
  Object.keys(publicDir.files).forEach((fileName) => {
    const path = `${PUBLIC_DIR}/${fileName}`;
    copyFile(originalVfs, path, targetVfs, path);
  });
}

function copyFile(
  originalVfs: VirtualFS,
  originalPath: string,
  targetVfs: VirtualFS,
  targetPath: string
) {
  const readStatus = getFileContent(originalVfs, originalPath);
  if (readStatus.status === 'ok') {
    writeFile(targetVfs, targetPath, readStatus.content);
    // } else {
    // throw new Error(`No '${originalPath}'`);
  }
}
