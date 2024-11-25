export * from './loaders';
export * from './types';

import {
  Path,
  VirtualFS,
  DirNode,
  FileNode,
  FileDirent,
  err,
  FileReadResult,
  ok,
} from './types';

const SEP = '/';

const splitPath = (path: Path): string[] =>
  Array.isArray(path) ? path : path.split(SEP);

export const joinPath = (path: Path): string => {
  if (!Array.isArray(path)) return path;
  return path.filter((e) => e.length > 0).join(SEP);
};

const parsePath = (path: Path): [string[], string] => {
  const dirParts = splitPath(path);
  const result: string[] = [];

  for (const part of dirParts) {
    if (part === '.') {
      continue;
    } else if (part === '..') {
      result.pop();
    } else {
      result.push(part);
    }
  }

  const fileName = result.pop()!;
  // console.log({ path, dir, fileName });
  return [result, fileName];
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

export const writeFile = (
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
): FileReadResult<{ dirent: FileDirent }> => {
  const [dirs, fileName] = parsePath(path);
  let curDir: DirNode = { type: 'directory', files: vfs.files };

  for (const subdir of dirs) {
    if (subdir === '.') continue;
    const childDir = curDir.files[subdir];
    if (!childDir || childDir.type !== 'directory') return err('e-no-entry');
    curDir = childDir;
  }

  const res = curDir.files[fileName];
  return res ? ok({ dirent: res }) : err('e-no-entry');
};

export const getFileContent = (
  vfs: VirtualFS,
  path: Path
): FileReadResult<{ content: string }> => {
  const textFile = getDirent(vfs, path);
  if (textFile.status === 'error') return err(textFile.error);
  if (textFile.dirent.type === 'directory') return err('e-not-a-file');

  return ok({ content: textFile.dirent.content });
};

export const vfsDebugTree = (vfs: VirtualFS) => {
  // eslint-disable-next-line no-console
  const log = (...args: unknown[]) => console.log(...args);

  log(`Virtual file system`); // (basePath '${vfs.basePath}')

  const printDirent = (fileName: string, entry: FileDirent, depth: number) => {
    const ws = ' '.repeat(depth * 2) + '| ';
    if (depth == 3) return;

    if (entry.type === 'file') {
      log(ws + fileName);
    } else {
      if (fileName.length) {
        log(ws + fileName + '/');
      }
      Object.keys(entry.files).forEach((k) => {
        const child = entry.files[k];
        if (child) {
          printDirent(k, child, depth + 1);
        }
      });
    }
  };

  printDirent('', { type: 'directory', files: vfs.files }, 0);
};
