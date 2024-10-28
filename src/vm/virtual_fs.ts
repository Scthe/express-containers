import { fetchFileText } from '../utils';

type FileNode = {
  type: 'file';
  content: string;
};

type DirNode = {
  type: 'directory';
  files: VirtualFS;
};

export type FileDirent = FileNode | DirNode;

export type VirtualFS = Record<string, FileDirent | undefined>;

type Path = string | string[];

const SEP = '/';

const splitPath = (path: Path): string[] =>
  Array.isArray(path) ? path : path.split(SEP);

const parsePath = (path: Path): [string[], string] => {
  const dir = splitPath(path);
  const fileName = dir.pop()!;
  return [dir, fileName];
};

const mkdirp = (vfs: VirtualFS, path: Path): DirNode => {
  const dirs = splitPath(path);
  let curDir: DirNode = { type: 'directory', files: vfs };

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

const writeFile = (vfs: VirtualFS, path: Path, content: string) => {
  const [dirs, fileName] = parsePath(path);
  const dirNode = mkdirp(vfs, dirs);
  // console.log('write', { path, dir, fileName, dirNode });

  dirNode.files[fileName] = { type: 'file', content };
};

export const getFileContent = (
  vfs: VirtualFS,
  path: Path
): string | undefined => {
  const [dirs, fileName] = parsePath(path);
  let curDir: DirNode = { type: 'directory', files: vfs };

  for (const subdir of dirs) {
    let childDir = curDir.files[subdir];
    if (!childDir || childDir.type !== 'directory') return undefined;
    curDir = childDir;
  }

  const textFile = curDir.files[fileName];
  return textFile?.type === 'file' ? textFile.content : undefined;
};

export async function loadVirtualFileSystem(path?: string): Promise<VirtualFS> {
  if (!path) return {};

  const vfs: VirtualFS = {};

  const content = await fetchFileText(path);
  const vsfDesc = JSON.parse(content);
  const promises = vsfDesc.files.map(async (path: string) => {
    // console.log(path);
    const content = await fetchFileText('init-fs/' + path);
    writeFile(vfs, path, content);
  });
  await Promise.all(promises);

  return vfs;
}
