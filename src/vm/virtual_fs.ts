import { fetchFileText } from '../utils';

type FileNode = {
  type: 'file';
  content: string | undefined; // lazy init
};

type DirNode = {
  type: 'directory';
  files: VirtualFS;
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

const writeFile = (
  vfs: VirtualFS,
  path: Path,
  content: FileNode['content']
) => {
  const [dirs, fileName] = parsePath(path);
  const dirNode = mkdirp(vfs, dirs);
  // console.log('write', { path, dir, fileName, dirNode });

  dirNode.files[fileName] = { type: 'file', content };
};

export const getFileContent = async (
  vfs: VirtualFS,
  path: Path
): Promise<string | undefined> => {
  const [dirs, fileName] = parsePath(path);
  let curDir: DirNode = { type: 'directory', files: vfs };

  for (const subdir of dirs) {
    if (subdir === '.') continue;
    let childDir = curDir.files[subdir];
    if (!childDir || childDir.type !== 'directory') return undefined;
    curDir = childDir;
  }

  const textFile = curDir.files[fileName];
  if (textFile?.type !== 'file') return undefined;

  if (!textFile.content) {
    let discPath = joinPath(path);
    if (vfs.basePath.length > 0) {
      discPath = `${vfs.basePath}${SEP}${path}`;
    }
    console.log(`Reading file '${discPath}'`);
    textFile.content = await fetchFileText(discPath);
  }
  return textFile.content;
};

export async function loadVirtualFileSystem(path?: string): Promise<VirtualFS> {
  const vfs: VirtualFS = { basePath: '', files: {} };
  if (!path) return vfs;

  const content = await fetchFileText(path);
  const vsfDesc = JSON.parse(content);
  vfs.basePath = vsfDesc.basePath || '';

  // create nodes for all files
  const promises = vsfDesc.files.map(async (path: string) => {
    // console.log(path);
    // const content = await fetchFileText('init-fs/' + path);
    writeFile(vfs, path, undefined);
  });
  await Promise.all(promises);

  return vfs;
}
