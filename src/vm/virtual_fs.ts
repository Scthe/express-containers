import JSZip from 'jszip';
import { staticFiles } from '../utils';

type FileNode = {
  type: 'file';
  // content: string | undefined; // lazy init
  content: string;
};

type DirNode = {
  type: 'directory';
  files: Record<string, FileDirent | undefined>;
};

export type FileDirent = FileNode | DirNode;

export type VirtualFS = {
  basePath: string;
  files: Record<string, FileDirent | undefined>;
};

type Path = string | string[];

const SEP = '/';

const splitPath = (path: Path): string[] =>
  Array.isArray(path) ? path : path.split(SEP);

const joinPath = (path: Path): string =>
  Array.isArray(path) ? path.join(SEP) : path;

const parsePath = (path: Path): [string[], string] => {
  const dir = splitPath(path);
  const fileName = dir.pop()!;
  return [dir, fileName];
};

const mkdirp = (vfs: VirtualFS, path: Path): DirNode => {
  const dirs = splitPath(path);
  let curDir = { type: 'directory', files: vfs.files } satisfies DirNode;

  for (const subdir of dirs) {
    let childDir = curDir.files[subdir];
    if (!childDir) {
      childDir = { type: 'directory', files: {} };
    }

    if (childDir.type === 'file')
      throw new Error(`Expected '${subdir}' to be directory, was file`);
    curDir.files[subdir] = childDir;
    curDir = childDir;
  }
  return curDir;
};

const writeFile = (
  vfs: VirtualFS,
  path: Path,
  content: FileNode['content']
) => {
  const [dirs, fileName] = parsePath(path);
  const dirNode = mkdirp(vfs, dirs);
  // console.log('write', { path, dirs, fileName, dirNode });

  dirNode.files[fileName] = { type: 'file', content };
};

export const getDirent = (
  vfs: VirtualFS,
  path: Path
): FileDirent | undefined => {
  const [dirs, fileName] = parsePath(path);
  let curDir: DirNode = { type: 'directory', files: vfs.files };

  for (const subdir of dirs) {
    if (subdir === '.') continue;
    let childDir = curDir.files[subdir];
    if (!childDir || childDir.type !== 'directory') return undefined;
    curDir = childDir;
  }

  return curDir.files[fileName];
};

export const getFileContent = (
  vfs: VirtualFS,
  path: Path
): string | undefined => {
  const textFile = getDirent(vfs, path);
  if (textFile?.type !== 'file') return undefined;

  /*// handle lazy load if needed
  if (!textFile.content) {
    let discPath = joinPath(path);
    if (vfs.basePath.length > 0) {
      discPath = `${vfs.basePath}${SEP}${path}`;
    }
    // console.log(`Reading file '${discPath}'`);
    textFile.content = await fetchFileText(discPath);
  }*/
  return textFile.content;
};

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
    const content = await staticFiles.fetchFileText('init-fs/' + path);
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

  for (const file of zip.file(/.?/g)) {
    // console.log('file', file.name);
    if (file.dir) continue;
    const content = await file.async('text');
    const filePath = file.name.replaceAll('\\', '/');
    writeFile(vfs, filePath, content);
  }

  return vfs;
}
