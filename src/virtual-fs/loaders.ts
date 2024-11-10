import JSZip from 'jszip';
import { staticFiles } from 'utils';
import { writeFile } from '.';
import { VirtualFS } from './types';

export async function loadVirtualFileSystem_json(
  path?: string
): Promise<VirtualFS> {
  const vfs: VirtualFS = { basePath: '', files: {} };
  if (!path) return vfs;

  const content = await staticFiles.fetchFileText(path);
  const vsfDesc = JSON.parse(content);
  vfs.basePath = vsfDesc.basePath || '';

  // create nodes for all files
  const promises = vsfDesc.files.map(async (path: string) => {
    // console.log(path);
    const content = await staticFiles.fetchFileText(vfs.basePath + '/' + path);
    writeFile(vfs, path, content);
  });
  await Promise.all(promises);

  return vfs;
}

export async function loadVirtualFileSystem_zip(
  path?: string
): Promise<VirtualFS> {
  const vfs: VirtualFS = { basePath: '', files: {} };
  if (!path) return vfs;

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
