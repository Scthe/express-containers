import JSZip from 'jszip';
import { staticFiles } from 'utils';
import { writeFile } from '.';
import { VirtualFS } from './types';

export const createVirtualFileSystem = (): VirtualFS => ({
  files: {},
});

export const writeStaticFile = async (
  vfs: VirtualFS,
  staticPath: string,
  vfsPath?: string
) => {
  vfsPath = vfsPath || staticPath;
  const content = await staticFiles.fetchFileText(staticPath);
  return writeFile(vfs, vfsPath, content);
};

/*
export async function loadVirtualFileSystem_json(
  path: string
): Promise<VirtualFS> {
  const vfs = createVirtualFileSystem();

  const content = await staticFiles.fetchFileText(path);
  const vsfDesc = JSON.parse(content);
  vfs.basePath = vsfDesc.basePath || '';

  // create nodes for all files
  const promises = vsfDesc.files.map(async (path: string) => {
    // console.log(path);
    return writeStaticFile(vfs, path);
  });
  await Promise.all(promises);

  return vfs;
}*/

export async function loadVirtualFileSystem_zip(
  path: string
): Promise<VirtualFS> {
  const vfs = createVirtualFileSystem();

  const content = await staticFiles.fetchFileBlob(path);
  const zip = await JSZip.loadAsync(content);
  const allFiles = zip.filter(() => true);

  const promises = allFiles.map(async (file) => {
    // if (file.name.includes('index')) console.log('file', file.name);
    if (file.dir) return;
    const content = await file.async('text');
    const filePath = file.name.replaceAll('\\', '/');
    writeFile(vfs, filePath, content);
  });
  await Promise.all(promises);

  return vfs;
}
